module.exports = function (item) {
    videoId = item.videos.results.length > 0 ? item.videos.results[0].key : ""
    return ({
        movieId: item.id,
        title: item.title,
        overview: item.overview,
        releaseDate: item.release_date,
        homepage: item.homepage,
        posterUrl: "https://image.tmdb.org/t/p/w780" + item.poster_path,
        videoId: videoId
    });
};