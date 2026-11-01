export default function verifyFields(fields: any): Boolean {
  for (let i = 0; i < fields.length; i++) {
    const field = fields[i];
    if (
      field == "" ||
      !field ||
      field == null ||
      field == undefined ||
      (Array.isArray(field) && field.length == 0)
    ) {
      return false;
    }
  }
  return true;
}
