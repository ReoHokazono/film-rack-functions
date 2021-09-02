require('dotenv').config();
const fetch = require('node-fetch');
const { BlobServiceClient } = require("@azure/storage-blob");
const formatMovieItem = require("../SharedCode/MovieDetailHelper");

module.exports = async function (context, myTimer) {    
    const baseUrl = "https://api.themoviedb.org/3/movie/";
    const baseParams = new URLSearchParams();
    baseParams.append("api_key", process.env.API_KEY);
    baseParams.append("language", "ja-JP");

    const nowPlayingParams = new URLSearchParams();
    Object.assign(nowPlayingParams, baseParams);
    nowPlayingParams.append("region", "JP");
    
    const url = baseUrl + "now_playing?" + nowPlayingParams.toString();
    const res = await (await fetch(url)).json();
    let movies = res.results;
    if (res.total_pages) {
        const restPages = res.total_pages - 1;
        let tasks = [];
    
        for (let i = 0; i < restPages; i++) {

            tasks.push((async () => {
                const params = new URLSearchParams();
                Object.assign(params, nowPlayingParams);
                params.append("page", `${i + 2}`);
                const url = baseUrl + "now_playing?" + params.toString();
                const res = await (await fetch(url)).json();
                movies = movies.concat(res.results)
            })());
        }
        await Promise.all(tasks);
    }
    
    detailParams = new URLSearchParams();
    Object.assign(detailParams, baseParams);
    detailParams.append("append_to_response", "videos");
    
    let tasks = [];
    let movieDetails = [];
    movies.forEach(movie => {
        tasks.push( (async () => {
            const movieId = movie.id;
            const url = baseUrl + movieId + "?" + detailParams.toString();
            const res = await (await fetch(url)).json();
            movieDetails.push(formatMovieItem(res));
        })() )
    });

    await Promise.all(tasks);

    const jsonDate = new Date().toJSON()
    const jsonText = JSON.stringify({ lastupdate: jsonDate, result: movieDetails });
    const jsonLength = Buffer.byteLength(jsonText);
    
    context.log(jsonText)
    const STORAGE_CONNECTION_STRING = process.env.STORAGE_CONNECTION_STRING;

    const blobServiceClient = BlobServiceClient.fromConnectionString(STORAGE_CONNECTION_STRING);
    const containerName = "public-movielist";
    const containerClient = blobServiceClient.getContainerClient(containerName);
    const blobName = "now-playing.json";
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    await blockBlobClient.upload(jsonText, jsonLength);
};