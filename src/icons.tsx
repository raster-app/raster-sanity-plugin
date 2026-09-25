import { type SVGProps } from "react";

/**
 * Icons inlined from @sanity/icons, whose v5 imports fail at runtime on v3/v4 (see README).
 * Path data used under its licence:
 *
 * > MIT License. Copyright (c) 2026 Sanity.io
 * >
 * > Permission is hereby granted, free of charge, to any person obtaining a copy of this
 * > software and associated documentation files (the "Software"), to deal in the Software
 * > without restriction, including without limitation the rights to use, copy, modify, merge,
 * > publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons
 * > to whom the Software is furnished to do so, subject to the following conditions:
 * >
 * > The above copyright notice and this permission notice shall be included in all copies or
 * > substantial portions of the Software.
 * >
 * > THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED,
 * > INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR
 * > PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE
 * > FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
 * > OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * > DEALINGS IN THE SOFTWARE.
 */

type IconProps = SVGProps<SVGSVGElement>;

/** Sanity's icon geometry: a 25×25 grid, 1em box, 1.2 stroke in `currentColor`. */
function Svg({ name, children, ...props }: IconProps & { name: string }) {
  return (
    <svg
      data-raster-icon={name}
      width="1em"
      height="1em"
      viewBox="0 0 25 25"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      {children}
    </svg>
  );
}

const STROKE = {
  stroke: "currentColor",
  strokeWidth: 1.2,
  strokeLinejoin: "round",
} as const;

export function ImageIcon(props: IconProps) {
  return (
    <Svg name="image" {...props}>
      <path
        d="M5.5 15.5L8.79289 12.2071C9.18342 11.8166 9.81658 11.8166 10.2071 12.2071L12.8867 14.8867C13.2386 15.2386 13.7957 15.2782 14.1938 14.9796L15.1192 14.2856C15.3601 14.1049 15.6696 14.0424 15.9618 14.1154L19.5 15M5.5 6.5H19.5V18.5H5.5V6.5ZM15.5 10.5C15.5 11.0523 15.0523 11.5 14.5 11.5C13.9477 11.5 13.5 11.0523 13.5 10.5C13.5 9.94772 13.9477 9.5 14.5 9.5C15.0523 9.5 15.5 9.94772 15.5 10.5Z"
        {...STROKE}
      />
    </Svg>
  );
}

export function RefreshIcon(props: IconProps) {
  return (
    <Svg name="refresh" {...props}>
      <path
        d="M19.5 13.5C19.5 17.366 16.366 20.5 12.5 20.5C8.63401 20.5 5.5 17.366 5.5 13.5C5.5 9.63401 8.63401 6.5 12.5 6.5H15.5"
        {...STROKE}
      />
      <path d="M11.5 10.5L15.5 6.5L11.5 2.5" {...STROKE} />
    </Svg>
  );
}

export function UploadIcon(props: IconProps) {
  return (
    <Svg name="upload" {...props}>
      <path d="M12.5 6V15.5M5.5 15.5H19.5V19.5H5.5V15.5Z" {...STROKE} />
      <path d="M7.5 11L12.5 6L17.5 11" {...STROKE} />
    </Svg>
  );
}

export function LeaveIcon(props: IconProps) {
  return (
    <Svg name="leave" {...props}>
      <path d="M14.5 15V18.5H5.5V6.5H14.5V10M9 12.5H21.5" {...STROKE} />
      <path d="M18 9L21.5 12.5L18 16" {...STROKE} />
    </Svg>
  );
}

export function LaunchIcon(props: IconProps) {
  return (
    <Svg name="launch" {...props}>
      <path d="M12 7.5H6.5V18.5H17.5V13M19.5 5.5L10.5 14.5" {...STROKE} />
      <path d="M14 5.5H19.5V11" {...STROKE} />
    </Svg>
  );
}

export function ClipboardIcon(props: IconProps) {
  return (
    <Svg name="clipboard" {...props}>
      <path
        d="M8 5.5H6.5V19.5H18.5V5.5H17M12.5 3C11.5 3 11.5 4.5 11 4.5C10 4.5 9.5 5 9.5 6.5H15.6C15.6 5 15 4.5 14 4.5C13.5 4.5 13.5 3 12.5 3Z"
        {...STROKE}
      />
    </Svg>
  );
}

export function PublishIcon(props: IconProps) {
  return (
    <Svg name="publish" {...props}>
      <path d="M4.99997 5.50006H20M12.5 9.00005V20" {...STROKE} />
      <path d="M7.5 14L12.5 9.00006L17.5 14" {...STROKE} />
    </Svg>
  );
}

export function SearchIcon(props: IconProps) {
  return (
    <Svg name="search" {...props}>
      <path
        d="M15.0355 15.0355L20 20M16.5 11.5C16.5 14.2614 14.2614 16.5 11.5 16.5C8.73858 16.5 6.5 14.2614 6.5 11.5C6.5 8.73858 8.73858 6.5 11.5 6.5C14.2614 6.5 16.5 8.73858 16.5 11.5Z"
        {...STROKE}
      />
    </Svg>
  );
}
