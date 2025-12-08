import PhotoDisplay from "../components/PhotoDisplay";

export default function PhotoExample() {
  return (
    <div>
      <h2>Dishcord Photo</h2>
      <PhotoDisplay
        awsUrl="s3://dishcord-yelp-photos/uploaded-images/--0h6FMC0V8aMtKQylojEg.jpg"
        width={350}
      />
    </div>
  );
}
