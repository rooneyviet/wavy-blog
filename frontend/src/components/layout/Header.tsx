import Logo from "./Logo";
import NavLinks from "./NavLinks";
import SubscribeButton from "./SubscribeButton";
import MobileMenuButton from "./MobileMenuButton";

const Header = () => {
  return (
    <nav className="bg-white py-4 shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 flex justify-between items-center">
        <Logo />
        <NavLinks />
        <div className="flex items-center">
          <SubscribeButton />
          <MobileMenuButton />
        </div>
      </div>
    </nav>
  );
};

export default Header;
