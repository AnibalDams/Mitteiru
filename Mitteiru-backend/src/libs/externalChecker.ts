export default function externalCheck(mimetype: string) {
  switch (mimetype) {
    case "mp4":
      return false;
    case "mkv":
      return false;

    case "html":
      return true;
    default:
      return false;
  }
}
