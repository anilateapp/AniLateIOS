window.Anixtar = window.Anixtar || {};

(async function(namespace) {
    const fetchJson = async (url) => {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP error ${response.status}`);
        return response.json();
    };

    const fetchVideo = async (id) => {
        try {
            const data = await fetchJson(`https://api-s2.anixart.tv/episode/${id}`);
            const result = [];

            if(data.code === 1) await Promise.reject(new Error(`Заблокировано`));
            if (!data.types || data.types.length === 0) {
               await Promise.reject(new Error("Список пуст"))
            }

            const dubbingPromises = data.types.map(async (dubbing) => {
                const players = await fetchJson(`https://api-s2.anixart.tv/episode/${id}/${dubbing.id}`);
                const playerPromises = players.sources.map(async (player) => {
                    const video = await fetchJson(`https://api-s2.anixart.tv/episode/${id}/${dubbing.id}/${player.id}`);
                    const videoItems = video.episodes.map(videoItem => ({
                        dubbingName: dubbing.name,
                        playerName: player.name,
                        videoId: genVideoId(id,dubbing.id,player.id,videoItem["@id"]),
                        videoUrl: videoItem.url,
                        videoNumber: videoItem.position,
                        videoName: videoItem.name,
                        dateUpload: videoItem.addedDate,
                        isFrame: videoItem.iframe,
                    }));
                    result.push(...videoItems);
                });
                return Promise.all(playerPromises);
            });
            await Promise.all(dubbingPromises);

            return JSON.stringify(result, null, 2);
        } catch (error) {
            throw error;
        }
    };

    const fetchFromUrl = async (url) => {
        try {
            const data = await fetchJson(url);
            return JSON.stringify(data.content.map(anime => ({
                url: anime.id,
                title: anime.title_ru,
                views: anime.views,
                thumbnail_url: anime.image,
                status: anime.status.id
            })), null, 2);
        } catch (error) {
            return `Ошибка: ${error.message}`;
        }
    };

    const fetchFromDetails = async (id = 10907) => {
        try {
            const data = await fetchJson(`https://api.anixart.tv/release/${id}`);
            const responce = data.release;
            return JSON.stringify({
                url: responce.id,
                title: responce.title_ru,
                descr: responce.description,
                thumbnail_url: responce.image,
                status: status(responce.status.id)
            }, null, 2);
        } catch (error) {
            return `Ошибка: ${error.message}`;
        }
    };

    const genVideoId = (releaseId, sourceId,playerId, vidId) => {
        return `${releaseId}${sourceId}${playerId}${vidId}`;
    };

    const status = (int) => {
        return int === 1 ? 3 : int === 2 ? 2 : int === 3 ? 1 : 0;
    };

    namespace.FetchVideos = (id = 20075) => fetchVideo(id);
    namespace.FetchDetails = (id = 19348) => fetchFromDetails(id);

    namespace.FetchPopular = async (offset = 0) => {
        const url = `https://api.anixart.tv/filter/${offset}?token=&studio=&category=&status=&year=&episodes=&sort=1&country=&season=&duration=&extended_mode=true`;
        return fetchFromUrl(url);
    };

    namespace.FetchLatestUpdates = async (offset = 0) => {
        const url = `https://api.anixart.tv/filter/${offset}?token=&studio=&category=&status=&year=&episodes=&sort=&country=&season=&duration=&extended_mode=true`;
        return fetchFromUrl(url);
    };
})(window.Anixtar);