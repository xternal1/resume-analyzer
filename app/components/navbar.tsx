import { Link } from 'react-router'

const navbar = () => {
  return (
    <nav className='navbar'>
        <Link to="/">
            <p className='text-2x1 font-bold text-gradient'>RESUMIND</p>
        </Link>
        <Link to="/upload" className='primary-button w-fit'>
            Upload Resume
        </Link>
    </nav>
  )
}

export default navbar