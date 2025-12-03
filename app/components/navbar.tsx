import { Link } from 'react-router'

type NavbarProps = {
  showWipeData?: boolean
  onToggleWipe?: () => void
}

const Navbar = ({ showWipeData = false, onToggleWipe }: NavbarProps) => {
  return (
    <nav className='navbar flex justify-between items-center p-4 bg-white shadow'>
      <Link to="/" className="ml-5">
        <p className='text-xl font-bold text-gradient'>RESUMIND</p>
      </Link>

      <div className="flex items-center gap-2">
        <button
          onClick={onToggleWipe}
          className={`px-4 py-2 rounded-full text-sm font-medium transition ${showWipeData
              ? "bg-gray-200 text-gray-700 hover:bg-gray-300"
              : "bg-red-500 text-white hover:bg-red-600"
            }`}
        > 
          {showWipeData ? "Cancel Delete" : "Delete Data"}
        </button>
        <Link to="/upload" className='primary-button w-fit ml-2'>
          Upload Resume
        </Link>
        <Link to="/cipher" className='primary-button w-fit'>
          Cipher Code
        </Link>
      </div>
    </nav>
  )
}

export default Navbar
