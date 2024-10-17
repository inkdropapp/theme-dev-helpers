import { Link } from "react-router-dom";

export const Nav = () => {
  return (
    <div className='nav'>
      <Link to='/'>Variables</Link>
      <Link to='/tokens'>Color Tokens</Link>
    </div>
  )
}
