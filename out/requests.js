"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendFile = void 0;
const node_fetch_1 = __importDefault(require("node-fetch"));
function sendFile(apiUrl, bodyData) {
    return new Promise(async (resolve, reject) => {
        try {
            // Make an HTTP POST request
            const response = await (0, node_fetch_1.default)(apiUrl, {
                method: 'POST',
                body: JSON.stringify(bodyData),
                headers: {
                    'Content-Type': 'application/json',
                }
            });
            // Check if the request was successful (status code 2xx)
            if (response.ok) {
                const data = await response.json();
                resolve(data);
            }
            else {
                reject({ message: `Request failed with status: ${response.status}` });
            }
        }
        catch (error) {
            reject({ message: `Error making request: ${error}` });
        }
    });
}
exports.sendFile = sendFile;
//# sourceMappingURL=requests.js.map