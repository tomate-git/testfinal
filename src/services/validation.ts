export const isNonEmptyString = (v: any) => typeof v === 'string' && v.trim().length > 0
export const isBoolean = (v: any) => typeof v === 'boolean'
export const isNumber = (v: any) => typeof v === 'number' && !Number.isNaN(v)
export const isDateString = (v: any) => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v)
export const isIsoDateTime = (v: any) => typeof v === 'string' && /T/.test(v)

export const validateUser = (u: any) => {
  if (!isNonEmptyString(u.id)) return 'invalid_id'
  if (!isNonEmptyString(u.email)) return 'invalid_email'
  if (!isNonEmptyString(u.role)) return 'invalid_role'
  if (!isNonEmptyString(u.type)) return 'invalid_type'
  return null
}

export const validateSpace = (s: any) => {
  if (!isNonEmptyString(s.id)) return 'invalid_id'
  if (s.name !== undefined && !isNonEmptyString(s.name)) return 'invalid_name'
  if (s.description !== undefined && !isNonEmptyString(s.description)) return 'invalid_description'
  if (s.category !== undefined && !isNonEmptyString(s.category)) return 'invalid_category'
  if (s.capacity !== undefined && !isNumber(s.capacity)) return 'invalid_capacity'
  if (s.image !== undefined && !isNonEmptyString(s.image)) return 'invalid_image'
  return null
}

export const validateReservation = (r: any) => {
  if (!isNonEmptyString(r.id)) return 'invalid_id'
  if (!isNonEmptyString(r.spaceid ?? r.spaceId)) return 'invalid_space'
  if (!isNonEmptyString(r.userid ?? r.userId)) return 'invalid_user'
  if (!(isDateString(r.date) || isIsoDateTime(r.date))) return 'invalid_date'
  if (r.enddate && !(isDateString(r.enddate) || isIsoDateTime(r.enddate))) return 'invalid_enddate'
  if (!isNonEmptyString(r.slot)) return 'invalid_slot'
  if (!isNonEmptyString(r.status)) return 'invalid_status'
  return null
}

export const validateMessage = (m: any) => {
  if (!isNonEmptyString(m.id)) return 'invalid_id'
  if (!isNonEmptyString(m.name)) return 'invalid_name'
  if (!isNonEmptyString(m.email)) return 'invalid_email'
  if (!isNonEmptyString(m.subject)) return 'invalid_subject'
  if (!(isNonEmptyString(m.content) || isNonEmptyString(m.attachment))) return 'invalid_content_or_attachment'
  return null
}

export const validateNotification = (n: any) => {
  if (!isNonEmptyString(n.id)) return 'invalid_id'
  if (!isNonEmptyString(n.userid ?? n.userId)) return 'invalid_user'
  if (!isNonEmptyString(n.title)) return 'invalid_title'
  if (!isNonEmptyString(n.message)) return 'invalid_message'
  return null
}
