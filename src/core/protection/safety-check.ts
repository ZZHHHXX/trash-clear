const PROTECTED_PREFIXES = [
  "C:\\WINDOWS\\",
  "C:\\PROGRAM FILES\\",
  "C:\\PROGRAM FILES (X86)\\",
  "C:\\PROGRAMDATA\\MICROSOFT\\",
  "C:\\USERS\\PUBLIC\\"
];

export function isProtectedPath(path: string) {
  const normalized = path.replace(/\//g, "\\").toUpperCase();
  return PROTECTED_PREFIXES.some((prefix) => normalized.startsWith(prefix));
}
