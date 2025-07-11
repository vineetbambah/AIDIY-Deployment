import React from 'react';

const BellIcon = ({ className = '', size = 24 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M12 2C10.897 2 10 2.897 10 4C10 4.276 10.112 4.526 10.287 4.713C7.056 5.297 4.5 8.033 4.5 11.5V16L3 18V19H21V18L19.5 16V11.5C19.5 8.033 16.944 5.297 13.713 4.713C13.888 4.526 14 4.276 14 4C14 2.897 13.103 2 12 2Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9 19C9 20.657 10.343 22 12 22C13.657 22 15 20.657 15 19"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default BellIcon; 