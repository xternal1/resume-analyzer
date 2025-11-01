import { useState } from "react";
import Navbar from "~/components/navbar";

export const meta = () => ([
    { title: 'Resumind | Cipher Decoder' },
    { name: 'description', content: 'Log into your account!' },
])

export default function CipherDecoder() {
    const [cipherType, setCipherType] = useState("caesar");
    const [inputText, setInputText] = useState("");
    const [key, setKey] = useState("");
    const [decodedText, setDecodedText] = useState("");

    const handleDecode = (e: React.FormEvent) => {
        e.preventDefault();
        let result = "";
        if (cipherType === "caesar") {
            const shift = parseInt(key) || 0;
            result = caesarDecode(inputText, shift);
        } else if (cipherType === "vigenere") {
            result = vigenereDecode(inputText, key);
        } else if (cipherType === "atbash") {
            result = atbashDecode(inputText);
        } else if (cipherType === "rot13") {
            result = caesarDecode(inputText, 13);
        }
        setDecodedText(result);
    };

    const caesarDecode = (text: string, shift: number) =>
        text
            .split("")
            .map((c) => {
                const code = c.charCodeAt(0);
                if (code >= 65 && code <= 90) return String.fromCharCode(((code - 65 - shift + 26) % 26) + 65);
                if (code >= 97 && code <= 122) return String.fromCharCode(((code - 97 - shift + 26) % 26) + 97);
                return c;
            })
            .join("");

    const vigenereDecode = (text: string, key: string) => {
        const result: string[] = [];
        key = key.toLowerCase().replace(/[^a-z]/g, "");
        let j = 0;
        for (let i = 0; i < text.length; i++) {
            const c = text[i];
            const code = c.charCodeAt(0);
            if (code >= 65 && code <= 90) {
                const shift = key.charCodeAt(j % key.length) - 97;
                result.push(String.fromCharCode(((code - 65 - shift + 26) % 26) + 65));
                j++;
            } else if (code >= 97 && code <= 122) {
                const shift = key.charCodeAt(j % key.length) - 97;
                result.push(String.fromCharCode(((code - 97 - shift + 26) % 26) + 97));
                j++;
            } else {
                result.push(c);
            }
        }
        return result.join("");
    };

    const atbashDecode = (text: string) =>
        text
            .split("")
            .map((c) => {
                const code = c.charCodeAt(0);
                if (code >= 65 && code <= 90) return String.fromCharCode(65 + (25 - (code - 65)));
                if (code >= 97 && code <= 122) return String.fromCharCode(97 + (25 - (code - 97)));
                return c;
            })
            .join("");

    return (
        <main className="bg-[url('/images/bg-main.svg')] bg-cover">
            <Navbar />
            <section className="main-section">
                <div className="page-heading py-16">
                    <h1>Cipher Decoder for your ARG!</h1>
                    <h2>Paste or write your Cipher Code here for the system to decode!</h2>
                    <form onSubmit={handleDecode} className="flex flex-col gap-4 mt-8">
                        <div className="form-div">
                            <label className="block font-medium mb-1">Cipher Type</label>
                            <select
                                value={cipherType}
                                onChange={(e) => setCipherType(e.target.value)}
                                className="border rounded p-2 w-full"
                            >
                                <option value="caesar">Caesar Cipher</option>
                                <option value="vigenere">Vigenère Cipher</option>
                                <option value="atbash">Atbash Cipher</option>
                                <option value="rot13">ROT13</option>
                            </select>
                        </div>

                        {(cipherType === "caesar" || cipherType === "vigenere") && (
                            <div className="form-div">
                                <label className="block font-medium mb-1">
                                    {cipherType === "caesar" ? "Shift Number" : "Key"}
                                </label>
                                <input
                                    type={cipherType === "caesar" ? "number" : "text"}
                                    value={key}
                                    onChange={(e) => setKey(e.target.value)}
                                    className="border rounded p-2 w-full"
                                />
                            </div>
                        )}

                        <div className="form-div">
                            <label className="block font-medium mb-1">Cipher Text</label>
                            <textarea
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value.toUpperCase())}
                                rows={5}
                                className="border rounded p-2 w-full"
                            />
                        </div>

                        <button
                            type="submit"
                            className="primary-button"
                        >
                            Decode
                        </button>

                        {decodedText && (
                            <div className="form-div">
                                <label className="block font-medium mb-1">Decoded Text</label>
                                <textarea
                                    value={decodedText}
                                    readOnly
                                    rows={5}
                                    className="border rounded p-2 w-full bg-gray-100"
                                />
                            </div>
                        )}
                    </form>
                </div>
            </section>
        </main>
    );
}
    