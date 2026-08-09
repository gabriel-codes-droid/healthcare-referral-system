// Every frontend Type (Patient, Referral, Appointment, etc.) expects an `id`
// field. Mongoose serializes documents with `_id` by default, so without this,
// every `.id` reference in the frontend (dropdown values, table keys, API
// calls like acceptReferral(referral.id, ...)) resolves to `undefined`.
//
// Apply this to every schema before calling mongoose.model(...).
function toJSONPlugin(schema) {
  schema.set('toJSON', {
    virtuals: true,
    transform: (_doc, ret) => {
      ret.id = ret._id.toString();
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  });
}

module.exports = toJSONPlugin;
