// request ka data (body / params / query) zod schema se check karo — galat ho to controller tak pahunchne hi mat do
import AppError from "../utils/AppError.js";

// use: router.post("/google", validate({ body: googleSchema }), googleAuth)
const validate = (schemas) => (req, res, next) => {
    for (const part of ["body", "params", "query"]) {
        if (!schemas[part]) continue;

        // body na aaye (Content-Type galat) to req.body undefined hota hai — {} maan ke check karo
        const result = schemas[part].safeParse(req[part] ?? {});

        if (!result.success) {
            // saare galat fields ek message me: "body.idToken: idToken is required; body.x: ..."
            const message = result.error.issues
                .map((issue) => `${[part, ...issue.path].join(".")}: ${issue.message}`)
                .join("; ");
            throw new AppError(400, message);
        }

        // cleaned data wapas req par (extra fields hat gaye, types sahi) —
        // Express 5 me req.query sirf getter hai, seedha assign nahi hota, isliye defineProperty
        Object.defineProperty(req, part, { value: result.data, writable: true, enumerable: true, configurable: true });
    }
    next();
};

export default validate;
