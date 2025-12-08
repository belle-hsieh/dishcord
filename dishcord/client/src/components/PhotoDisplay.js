import { useState } from "react";
import axios from "axios";

export default function PhotoDisplay() {
  const [imageSrc, setImageSrc] = useState(null);

  const loadImage = async () => {
    const awsUrl = "s3://dishcord-yelp-photos/uploaded-images/./-__4fB3-t0HUSOHb0lHZGA.jpg";

    const res = await axios.get(
      "http://localhost:8080/fetch-image",
      {
        params: { aws_url: awsUrl },
        responseType: "blob"
      }
    );

    const blobUrl = URL.createObjectURL(res.data);
    setImageSrc(blobUrl);
  };

  return (
    <div>
      <button onClick={loadImage}>Load Image</button>

      {imageSrc && (
        <img
          src={imageSrc}
          alt="Fetched from AWS"
          style={{ width: "300px", borderRadius: "10px" }}
        />
      )}
    </div>
  );
}
