import { Outlet } from 'react-router-dom'
import { Nav } from './nav'

export const Index = () => {
  return (
    <div className={`ui container`}>
      <Nav />
      <Outlet />
    </div>
  )
}

