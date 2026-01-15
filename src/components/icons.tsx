import type { SVGProps } from 'react';

export function Logo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M4.26 10.18 2 12.44l6.01 6.01 3.23-3.23" />
      <path d="M8.01 18.45 12 14.44l3.99 3.99L22 12.44l-2.26-2.26" />
      <path d="m12 14.44 3.23-3.23" />
      <path d="M16.74 6.29 14.48 8.55" />
      <path d="M12 2 9.52 4.48" />
    </svg>
  );
}
