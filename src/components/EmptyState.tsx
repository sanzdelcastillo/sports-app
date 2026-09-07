import { Link } from 'react-router-dom'

interface Props {
  title: string
  body: string
  actionTo?: string
  actionLabel?: string
}

export function EmptyState({ title, body, actionTo, actionLabel }: Props) {
  return (
    <div className="card empty">
      <h2>{title}</h2>
      <p>{body}</p>
      {actionTo && actionLabel ? (
        <Link className="cta" to={actionTo}>
          {actionLabel}
        </Link>
      ) : null}
    </div>
  )
}
