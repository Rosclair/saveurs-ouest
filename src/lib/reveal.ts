import { useEffect } from 'react'

export function useReveal(dep: unknown) {
  useEffect(() => {
    const els = document.querySelectorAll('.reveal:not(.is-in)')
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target) } })
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' })
    els.forEach(el => io.observe(el))
    return () => io.disconnect()
  }, [dep])
}
