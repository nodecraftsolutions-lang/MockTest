import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, User, LogOut, Settings, ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Navbar from './Navbar';

const Header = ({ isPublic = false }) => {
  return <Navbar isPublic={isPublic} />;
};

export default Header;