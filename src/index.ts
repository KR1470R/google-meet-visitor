import Visitor from "./Visitor";
import Config from "./Config";
import { exec } from "child_process";

async function main() {
  // @TODO Remove this and make exit from session properly
  // killing all google chrome instances
  exec("pkill -9 -f google-chrome");

  Config.init();

  const target_link = Config.get_param("TARGET_CALL_LINK");
  const visitor = new Visitor(target_link);
  await visitor.init();
}

main();
