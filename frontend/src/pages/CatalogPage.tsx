import { Header } from "../components/Header"

type CatalogPageProps = {
  isDarkMode: boolean
}

export const CatalogPage = ({ isDarkMode }: CatalogPageProps) => {
  return (
    <div className={isDarkMode ? 'bg-slate-900 text-slate-100' : 'bg-slate-100 text-slate-900'}>
      <Header isDarkMode={isDarkMode} />

      {/* листа от игри */}
    </div>
  )
}