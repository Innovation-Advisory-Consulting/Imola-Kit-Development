"use client";

// NOTE: This is a simple in-memory implementation of an authentication client.
//  It is used to demonstrate how to create a custom authentication client to connect to your API.

function generateToken() {
	const arr = new Uint8Array(12);
	globalThis.crypto.getRandomValues(arr);
	return Array.from(arr, (v) => v.toString(16).padStart(2, "0")).join("");
}

const user = {
	id: "USR-000",
	avatar: "/assets/avatar.png",
	firstName: "Sofia",
	lastName: "Rivers",
	email: "sofia@devias.io",
};

class AuthClient {
	async signUp(_) {
		const token = generateToken();
		localStorage.setItem("access_token", token);

		return { data: { user } };
	}

	async signInWithOAuth(_) {
		return { error: "Social authentication not implemented" };
	}

	async signInWithPassword(params) {
		const { email, password } = params;

		if (email !== "sofia@devias.io" || password !== "Secret1") {
			return { error: "Invalid credentials" };
		}

		const token = generateToken();
		localStorage.setItem("access_token", token);

		return { data: { user } };
	}

	async resetPassword(_) {
		return { error: "Password reset not implemented" };
	}

	async updatePassword(_) {
		return { error: "Update reset not implemented" };
	}

	async getUser() {
		const token = localStorage.getItem("access_token");

		if (!token) {
			return { data: { user: null } };
		}

		return { data: { user } };
	}

	async signOut() {
		localStorage.removeItem("access_token");

		return {};
	}
}

export const authClient = new AuthClient();
