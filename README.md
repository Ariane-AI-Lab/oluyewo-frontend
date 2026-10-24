# Oluyewo_Frontend

Build this app using the HTML files referenced below. You can hotlink the images referenced in the HTML. The attached images are screenshots of the desired screens. Here are public links to the html of the screens which you should read and use to build the app:

1. https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ7Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpaCiVodG1sXzAwMDY1ZTI1ZGNjZjFmM2EwMjNiZTkxOTNmMWVkMjZkEgsSBxDE26XE9xEYAZIBIwoKcHJvamVjdF9pZBIVQhMzMzI4MDc5Mzc2MTg5MzcwNjEz&filename=&opi=89354086

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/c415b072-40c1-4a73-9ef1-4aab281ced67).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

## Backend API

The verification form sends the rumor text and one image (an uploaded file or a public image URL) to the FastAPI streaming endpoint `POST /verify-rumor/stream`. Configure the backend origin with `VITE_API_BASE_URL`; it defaults to `http://localhost:8000` for local development. The backend must allow requests from the frontend origin through CORS.

Login and investigation history currently remain front-end-only mocks stored in the browser.
