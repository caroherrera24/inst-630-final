async function promiseData(url){
    return new Promise( async (resolve, reject) => {
      try {
        const request = await fetch(url);
        const json = await request.json();
        resolve(json);
    } catch (err) {
        reject(err);
      }
    }) 
}

export default promiseData;