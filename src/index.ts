import Visitor from "./Visitor";
import Config from "./Config";

async function main() {
  const visitor = new Visitor(Config.get_param("TARGET_CALL_LINK"));
  await visitor.init();
}

main();
