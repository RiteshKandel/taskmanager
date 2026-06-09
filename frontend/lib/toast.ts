import toast from 'react-hot-toast'

// Central notification helper — pre-defined messages for every action in the app
export const notify = {
  // ── Projects ──
  projectCreated: () => toast.success('Project created'),
  projectUpdated: () => toast.success('Project updated'),
  projectDeleted: () => toast.success('Project deleted'),

  // ── Tasks ──
  taskCreated:   () => toast.success('Task created'),
  taskUpdated:   () => toast.success('Task updated'),
  taskDeleted:   () => toast.success('Task deleted'),
  taskCompleted: () => toast.success('Task completed! ✓'),

  // ── Members ──
  memberAdded:    (name: string) => toast.success(`${name} added to project`),
  memberRemoved:  (name: string) => toast(`${name} removed`, { icon: '👋' }),
  roleUpdated:    () => toast.success('Role updated'),

  // ── Reminders ──
  reminderSet:    () => toast.success('⏰ Reminder set'),
  reminderRemoved:() => toast('Reminder removed', { icon: '🔕' }),

  // ── Auth ──
  loggedOut:   () => toast('Signed out', { icon: '👋' }),
  profileSaved:() => toast.success('Profile saved'),

  // ── Errors ──
  error:        (msg?: string) => toast.error(msg || 'Something went wrong'),
  networkError: () => toast.error('Connection error — check your internet'),
  permError:    () => toast.error("You don't have permission to do that"),

  // ── Promise toast — shows loading → success / error automatically ──
  promise: <T,>(
    promise: Promise<T>,
    msgs = { loading: 'Saving…', success: 'Saved!', error: 'Failed' }
  ) => toast.promise(promise, msgs),
}
