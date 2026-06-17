import requests
import logging
from django.conf import settings

logger = logging.getLogger(__name__)


# ── Core send function ────────────────────────────────────────

def send_email(to_email: str, to_name: str, subject: str, html_content: str) -> bool:
    """Send one email via Brevo HTTP API. Returns True on success."""
    if not settings.BREVO_API_KEY:
        logger.warning("BREVO_API_KEY not set — skipping email to %s", to_email)
        return False

    payload = {
        "sender": {
            "name":  settings.BREVO_SENDER_NAME,
            "email": settings.BREVO_SENDER_EMAIL,
        },
        "to": [{"email": to_email, "name": to_name}],
        "subject":     subject,
        "htmlContent": html_content,
    }
    headers = {
        "accept":       "application/json",
        "content-type": "application/json",
        "api-key":      settings.BREVO_API_KEY,
    }

    try:
        response = requests.post(
            "https://api.brevo.com/v3/smtp/email",
            json=payload,
            headers=headers,
            timeout=10,
        )
        response.raise_for_status()
        logger.info("Email sent to %s: %s", to_email, subject)
        return True
    except requests.RequestException as e:
        logger.error("Brevo API error: %s", e)
        return False


# ── HTML base template ─────────────────────────────────────────

def _base_template(title: str, body_html: str) -> str:
    app_url = settings.APP_URL
    return f"""
    <!DOCTYPE html><html><head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
      body  {{ margin:0; padding:0; background:#0e0f14; font-family:'Segoe UI',Arial,sans-serif; }}
      .wrap {{ max-width:520px; margin:0 auto; padding:32px 16px; }}
      .card {{ background:#1a1d28; border:1px solid rgba(255,255,255,.08); border-radius:14px; padding:28px 32px; }}
      .logo {{ font-size:13px; font-weight:700; color:#a89cf5; margin-bottom:24px; letter-spacing:.05em; }}
      h1    {{ font-size:18px; font-weight:600; color:#f0f0f5; margin:0 0 8px; }}
      p     {{ font-size:14px; color:#8b8fa8; line-height:1.6; margin:0 0 16px; }}
      .btn  {{ display:inline-block; background:#7c6af0; color:#fff; text-decoration:none;
               padding:10px 24px; border-radius:10px; font-size:13px; font-weight:600; margin-top:8px; }}
      .tag  {{ display:inline-block; background:rgba(124,106,240,.15); color:#a89cf5;
               font-size:11px; font-weight:600; padding:3px 10px; border-radius:20px; margin-bottom:16px; }}
      .footer {{ font-size:11px; color:#4a4e65; text-align:center; margin-top:20px; }}
      .divider {{ height:1px; background:rgba(255,255,255,.06); margin:20px 0; }}
    </style>
    </head><body>
    <div class="wrap">
      <div class="card">
        <div class="logo">⬡ Task Manager</div>
        {body_html}
      </div>
      <div class="footer">You received this because you are a member of this project.<br>
      <a href="{app_url}" style="color:#7c6af0">Open Task Manager</a></div>
    </div>
    </body></html>
    """


# ── Trigger 1: Task created / updated / completed ─────────────

def send_task_notification(user, task, action: str):
    """Notify assignees when a task is created, updated, or completed."""
    app_url  = settings.APP_URL
    proj_url = f"{app_url}/dashboard/projects/{task.project.id}"

    action_labels = {
        'created':   ('🆕 New Task',    'created a new task'),
        'updated':   ('✏️ Task Updated', 'updated a task'),
        'completed': ('✅ Task Done',    'marked a task as complete'),
    }
    tag_label, action_text = action_labels.get(action, ('📌 Task', 'updated a task'))

    due_line = ""
    if task.due_date:
        due_line = f'<p>📅 Due: <strong style="color:#f0f0f5">{task.due_date.strftime("%b %d, %Y")}</strong></p>'

    body = f"""
        <span class="tag">{tag_label}</span>
        <h1>{task.title}</h1>
        <p><strong style="color:#f0f0f5">{user.name}</strong> {action_text} in
           <strong style="color:#a89cf5">{task.project.title}</strong></p>
        {due_line}
        <div class="divider"></div>
        <a class="btn" href="{proj_url}">View Project →</a>
    """

    subject = f"[{task.project.title}] {task.title}"
    html    = _base_template(f"Task {action}", body)

    recipients = list(task.assignees.exclude(id=user.id))
    if hasattr(task.project, 'owner') and task.project.owner != user:
        recipients.append(task.project.owner)

    # Filter out anyone who muted this project
    from projects.models import ProjectMember as _PM  # local import avoids circular import
    muted_ids = set(
        _PM.objects
        .filter(project=task.project, notifications_muted=True)
        .values_list('user_id', flat=True)
    )
    recipients = [r for r in recipients if r.id not in muted_ids]

    sent_ids = set()
    for recipient in recipients:
        if recipient.id not in sent_ids:
            send_email(recipient.email, getattr(recipient, 'name', recipient.email), subject, html)
            sent_ids.add(recipient.id)


# ── Trigger 2: Reminder ───────────────────────────────────────

def send_reminder_email(user, task):
    """Reminder email sent to the user who set the reminder."""
    app_url  = settings.APP_URL
    proj_url = f"{app_url}/dashboard/projects/{task.project.id}"
    due_str  = task.due_date.strftime("%A, %B %d · %I:%M %p") if task.due_date else "soon"

    body = f"""
        <span class="tag">⏰ Reminder</span>
        <h1>{task.title}</h1>
        <p>This task is due <strong style="color:#fbbf24">{due_str}</strong></p>
        <p>Project: <strong style="color:#a89cf5">{task.project.title}</strong></p>
        <div class="divider"></div>
        <a class="btn" href="{proj_url}">Open Task →</a>
    """
    name = getattr(user, 'name', user.email)
    send_email(user.email, name, f"⏰ Reminder: {task.title}", _base_template("Task Reminder", body))


# ── Trigger 3: Added to project ───────────────────────────────

def send_project_invite_email(new_member, project, added_by, role: str):
    """Email sent when a user is added to a project."""
    app_url  = settings.APP_URL
    proj_url = f"{app_url}/dashboard/projects/{project.id}"

    role_labels = {
        'admin':  'Admin — can manage members and settings',
        'editor': 'Editor — can create and edit tasks',
        'viewer': 'Viewer — can view tasks and projects',
    }
    role_desc = role_labels.get(role, role)
    adder_name = getattr(added_by, 'name', added_by.email)

    body = f"""
        <span class="tag">📁 Project Invite</span>
        <h1>You've been added to {project.title}</h1>
        <p><strong style="color:#f0f0f5">{adder_name}</strong> added you to this project.</p>
        <p>Your role: <strong style="color:#a89cf5">{role_desc}</strong></p>
        <div class="divider"></div>
        <a class="btn" href="{proj_url}">Open Project →</a>
    """
    member_name = getattr(new_member, 'name', new_member.email)
    send_email(
        new_member.email, member_name,
        f"You've been added to {project.title}",
        _base_template("Project Invite", body)
    )
