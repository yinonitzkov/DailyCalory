import { Composition } from "remotion";
import { ArmWorkout, FPS, TOTAL_FRAMES } from "./ArmWorkout";

export const Root = () => (
  <Composition
    id="ArmWorkout"
    component={ArmWorkout}
    durationInFrames={TOTAL_FRAMES}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
