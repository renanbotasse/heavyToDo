import type { ID } from '@/entities'

export type ChannelMessage =
  | { type: 'TASK_UPDATED'; taskId: ID }
  | { type: 'TIMER_STARTED'; taskId: ID }
  | { type: 'TIMER_STOPPED'; taskId: ID }
  | { type: 'PROJECT_UPDATED'; projectId: ID }

export const CHANNEL = new BroadcastChannel('app-sync')

export function broadcast(message: ChannelMessage) {
  CHANNEL.postMessage(message)
}

export function onMessage(handler: (msg: ChannelMessage) => void) {
  CHANNEL.addEventListener('message', (e: MessageEvent<ChannelMessage>) => handler(e.data))
}
