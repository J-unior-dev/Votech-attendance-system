import schoolLogo from "../assets/votech-s7-academy-logo-transparent.png";

function SchoolLogo({ className = "h-12 w-12" }) {
  return (
    <img
      src={schoolLogo}
      alt="VOTECH S7 Academy"
      className={`${className} object-contain`}
    />
  );
}

export default SchoolLogo;