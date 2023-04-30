import net from "node:net";
const port_constraints = {
  min: 1024,
  max: 65535,
};

/**
 * Bruteforcing for free port in the local network.
 * @param ip Host ip (default localhost)
 * @param minPort Min available port (default 1024)
 * @param maxPort Max available port (default 65535)
 * @param amount Amount of available ports to get(default 1)
 * @returns Promise<number>
 */
export default function findFreePort(
  ip: string,
  minPort: number = port_constraints.min,
  maxPort: number = port_constraints.max,
  amount = 1
) {
  return new Promise<number[] | number>((resolve, reject) => {
    [minPort, maxPort].forEach((p) => {
      if (p < port_constraints.min || p > port_constraints.max)
        throw new Error("OverPortError");
    });

    const res: number[] = [];
    const probe = (
      ip: string,
      port: number,
      cb: (port: number | null, nextPort?: number) => void
    ) => {
      const s = net.createConnection({ port: port, host: ip });
      s.on("connect", () => {
        s.end();
        cb(null, port + 1);
      });
      s.on("error", () => {
        cb(port);
      }); // can't connect, port is available
    };
    const onprobe = (port: number | null, nextPort?: number) => {
      if (port) {
        if (amount > 1) {
          res.push(port);
          if (res.length >= amount) resolve(res);
          else setImmediate(() => probe(ip, port + 1, onprobe));
        } else resolve(port);
      } else {
        if (nextPort! >= maxPort) reject("No available port");
        else setImmediate(() => probe(ip, nextPort!, onprobe));
      }
    };
    probe(ip, minPort, onprobe);
  });
}
