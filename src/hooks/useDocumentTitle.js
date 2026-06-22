import { useEffect } from 'react'

const BASE = 'FocusFlow'

export default function useDocumentTitle(title) {
  useEffect(() => {
    const previous = document.title
    document.title = title ? `${title} · ${BASE}` : `${BASE} — turn goals into daily action`
    return () => {
      document.title = previous
    }
  }, [title])
}
