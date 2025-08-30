import { Link, type LinkProps } from "react-router";

interface MainLinkProps extends LinkProps {
  external?: boolean;
}

const classNames =
  "flex mt-5 uppercase font-raleway font-bold text-sm tracking-widest items-center main-link group";

export default function MainLink({
  children,
  external,
  to,
  ...props
}: MainLinkProps) {
  const content = (
    <>
      <div>
        <span className="rounded-full border-2 border-white/10 w-8 h-8 p-2.5 mr-3 leading-5 inline-block group-hover:bg-white/10 duration-100 transition-all">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 384 512"
            fill="white"
            className="-mt-0.5"
          >
            <path d="M3.4 81.7c-7.9 15.8-1.5 35 14.3 42.9L280.5 256 17.7 387.4C1.9 395.3-4.5 414.5 3.4 430.3s27.1 22.2 42.9 14.3l320-160c10.8-5.4 17.7-16.5 17.7-28.6s-6.8-23.2-17.7-28.6l-320-160c-15.8-7.9-35-1.5-42.9 14.3z" />
          </svg>
        </span>
      </div>
      <div className="-mt-2">{children}</div>
    </>
  );

  return external ? (
    <a
      href={to as string}
      className={classNames}
      {...props}
      target="_blank"
      rel="noreferrer"
    >
      {content}
    </a>
  ) : (
    <Link to={to} className={classNames} {...props}>
      {content}
    </Link>
  );
}
