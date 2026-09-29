// axios error se user ko dikhane layak message — server ka message, warna generic
// validate() wala "body.password: " prefix user ke kaam ka nahi, hata do
const getErrorMessage = (error) =>
    (error.response?.data?.message || "Something went wrong. Please try again.").replace(
        /\b(body|params|query)\.\w+: /g,
        "",
    );

export default getErrorMessage;
