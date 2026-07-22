import React, {
  useState,
  useContext,
  useRef,
  useEffect
} from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import profileIcon from '../assets/Generic avatar.svg';
import searchIcon from '../assets/search.svg';
import { AuthContext } from '../context/AuthContext';

export default function DashboardLayout({
  children,
  showSearch = false,
  searchValue = '',
  onSearchChange,
  searchPlaceholder = 'Search your collection...',
  onSearchSubmit
}) {
  const [isDropdownOpen, setIsDropdownOpen] =
    useState(false);

  const { logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setIsDropdownOpen(false);
      }
    }

    document.addEventListener(
      'mousedown',
      handleClickOutside
    );

    return () => {
      document.removeEventListener(
        'mousedown',
        handleClickOutside
      );
    };
  }, []);

  const handleLogout = () => {
    if (logout) {
      logout();
    } else {
      localStorage.removeItem('token');
      localStorage.removeItem('userId');
      localStorage.removeItem('email');
    }

    navigate('/');
  };

  const handleSearchInputChange = (event) => {
    if (onSearchChange) {
      onSearchChange(event.target.value);
    }
  };

  const handleSearchSubmit = (event) => {
    event.preventDefault();

    if (onSearchSubmit) {
      onSearchSubmit(searchValue);
    }
  };

  const handleClearSearch = () => {
    if (onSearchChange) {
      onSearchChange('');
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        height: '100vh',
        backgroundColor: '#FFFFFF',
        overflow: 'hidden'
      }}
    >
      <Sidebar />

      <div
        style={{
          flex: 1,
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        <header
          style={{
            height: '80px',
            backgroundColor: '#143910',
            display: 'flex',
            alignItems: 'center',
            gap: '32px',
            padding: '0 40px',
            justifyContent: showSearch
              ? 'space-between'
              : 'flex-end',
            flexShrink: 0
          }}
        >
          {showSearch && (
            <form
              onSubmit={handleSearchSubmit}
              role="search"
              style={{
                flex: 1,
                maxWidth: '900px',
                minWidth: 0
              }}
            >
              <div
                style={{
                  position: 'relative',
                  width: '100%'
                }}
              >
                <input
                  type="search"
                  value={searchValue}
                  onChange={handleSearchInputChange}
                  placeholder={searchPlaceholder}
                  aria-label={searchPlaceholder}
                  style={{
                    width: '100%',
                    height: '46px',
                    padding: searchValue
                      ? '0 92px 0 20px'
                      : '0 54px 0 20px',
                    borderRadius: '24px',
                    border: '2px solid #98B910',
                    backgroundColor: '#FFFFFF',
                    color: '#143910',
                    fontFamily: 'Inter, sans-serif',
                    fontSize: '15px',
                    fontWeight: '600',
                    outline: 'none'
                  }}
                  onFocus={(event) => {
                    event.currentTarget.style.boxShadow =
                      '0 0 0 3px rgba(152, 185, 16, 0.35)';
                  }}
                  onBlur={(event) => {
                    event.currentTarget.style.boxShadow =
                      'none';
                  }}
                />

                {searchValue && (
                  <button
                    type="button"
                    onClick={handleClearSearch}
                    aria-label="Clear search"
                    title="Clear search"
                    style={{
                      position: 'absolute',
                      right: '50px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      backgroundColor: 'transparent',
                      color: '#4B5563',
                      fontSize: '16px',
                      fontWeight: '700',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: 0
                    }}
                  >
                    ✕
                  </button>
                )}

                <button
                  type="submit"
                  aria-label="Search collection"
                  title="Search collection"
                  style={{
                    position: 'absolute',
                    right: '14px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: '28px',
                    height: '28px',
                    padding: '4px',
                    backgroundColor: 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <img
                    src={searchIcon}
                    alt=""
                    aria-hidden="true"
                    style={{
                      width: '20px',
                      height: '20px',
                      objectFit: 'contain'
                    }}
                  />
                </button>
              </div>
            </form>
          )}

          <div
            ref={dropdownRef}
            style={{
              position: 'relative',
              flexShrink: 0
            }}
          >
            <button
              type="button"
              onClick={() =>
                setIsDropdownOpen((previous) => !previous)
              }
              aria-label="Open profile menu"
              aria-expanded={isDropdownOpen}
              style={{
                width: '40px',
                height: '40px',
                padding: 0,
                backgroundColor: '#98B910',
                borderRadius: '50%',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                overflow: 'hidden'
              }}
            >
              <img
                src={profileIcon}
                alt="Profile"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover'
                }}
              />
            </button>

            {isDropdownOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: '56px',
                  right: 0,
                  width: '160px',
                  backgroundColor: '#FFFFFF',
                  border: '2px solid #98B910',
                  borderRadius: '8px',
                  boxShadow:
                    '0 4px 6px rgba(0, 0, 0, 0.3)',
                  overflow: 'hidden',
                  zIndex: 100,
                  display: 'flex',
                  flexDirection: 'column'
                }}
              >
                <button
                  type="button"
                  onClick={() => {
                    setIsDropdownOpen(false);
                    navigate('/profile');
                  }}
                  style={{
                    padding: '12px 16px',
                    textAlign: 'left',
                    backgroundColor: '#FFFFFF',
                    borderBottom: '1px solid #E5E7EB',
                    fontSize: '16px',
                    color: '#143910',
                    fontWeight: '600'
                  }}
                  onMouseEnter={(event) => {
                    event.currentTarget.style.backgroundColor =
                      '#F3F4F6';
                  }}
                  onMouseLeave={(event) => {
                    event.currentTarget.style.backgroundColor =
                      '#FFFFFF';
                  }}
                >
                  Profile
                </button>

                <button
                  type="button"
                  onClick={handleLogout}
                  style={{
                    padding: '12px 16px',
                    textAlign: 'left',
                    backgroundColor: '#FFFFFF',
                    fontSize: '16px',
                    color: '#DC2626',
                    fontWeight: '600'
                  }}
                  onMouseEnter={(event) => {
                    event.currentTarget.style.backgroundColor =
                      '#FEF2F2';
                  }}
                  onMouseLeave={(event) => {
                    event.currentTarget.style.backgroundColor =
                      '#FFFFFF';
                  }}
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </header>

        <main
          style={{
            flex: 1,
            padding: '40px',
            overflowY: 'auto',
            overflowX: 'hidden'
          }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}