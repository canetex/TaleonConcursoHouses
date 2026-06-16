import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Layout } from './components/Layout'
import { HomePage } from './pages/HomePage'
import { RegisterPage } from './pages/RegisterPage'
import { VotePage } from './pages/VotePage'
import { HouseDetailPage } from './pages/HouseDetailPage'
import { RankingPage, AdminPage } from './pages/RankingPage'
import { AuthCallbackPage } from './pages/AuthCallbackPage'
import { RulesPage } from './pages/RulesPage'

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, '') || undefined}>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="inscrever" element={<RegisterPage />} />
          <Route path="votar" element={<VotePage />} />
          <Route path="regras" element={<RulesPage />} />
          <Route path="ranking" element={<RankingPage />} />
          <Route path="admin" element={<AdminPage />} />
          <Route path="house/:id" element={<HouseDetailPage />} />
          <Route path="auth/callback" element={<AuthCallbackPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
