// server ka lint — galtiyan pakadne ke liye (unused variable, undefined naam...), formatting Prettier ka kaam hai
import js from "@eslint/js";
import globals from "globals";
import { defineConfig, globalIgnores } from "eslint/config";

export default defineConfig([
    globalIgnores(["node_modules"]),
    {
        files: ["**/*.js"],
        extends: [js.configs.recommended],
        languageOptions: {
            globals: globals.node, // process, console, Buffer... Node ke globals
        },
        rules: {
            "no-unused-vars": [
                "error",
                {
                    argsIgnorePattern: "^_", // Express error handler ko 4 args chahiye — unused wale "_next" likho
                    ignoreRestSiblings: true, // const { password, ...safe } = user — password hatane ke liye nikala, use nahi
                },
            ],
        },
    },
]);
