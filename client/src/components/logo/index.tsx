import { Link } from "react-router-dom";
import logoSvg from "@/assets/OIP.webp";
import { cn } from "@/lib/utils";

interface LogoProps {
  url?: string;
  showText?: boolean;
  imgClass?: string;
  textClass?: string;
}

const Logo = ({
  url = "/",
  showText = true,
  imgClass = "size-[40px]",
  textClass,
}: LogoProps) => {
    return(
        <Link to={url} className="flex items-center gap-2 w-fit">
            <img src={logoSvg} alt="Chatify logo" className={cn(imgClass)} />
            {showText && (
            <span className={cn("font-semibold text-lg leading-tight", textClass)}>
                Chatify
            </span>
            )}
        </Link>
)};

export default Logo;