require('dotenv').config();
const fetch = require('node-fetch');
const formatMovieItem = require("../SharedCode/MovieDetailHelper");

module.exports = async function (context, req) {
    const movieId = req.query.movieid;

    if (movieId) {
        const baseUrl = "https://api.themoviedb.org/3/movie/";
        const params = new URLSearchParams();
        params.append("api_key", process.env.API_KEY);
        params.append("language", "ja-JP");
        params.append("append_to_response", "videos");

        const url = baseUrl + movieId + "?" + params.toString();
        try {
            const res = await (await fetch(url)).json();
            item = formatMovieItem(res);
            context.res = {
                body: JSON.stringify(item)
            };
        } catch (error) {
            context.res = {
                status: 404,
                body: "Item Not found"
            }
        }
    } else {
        context.res = {
            status: 400,
            body: "movieid not specified"
        }
    }    
};