import { useEffect, useMemo, useRef, useState } from "react";
import ForceGraph3D, { type ForceGraphMethods, type LinkObject } from "react-force-graph-3d";
import * as THREE from "three";
import SpriteText from "three-spritetext";
import { Building2, MapPin, Share2, User, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { GraphLink, GraphNode } from "@/types";

const ROOT_COLOR = "#facc15";
const USER_COLOR = "#f97316";
const CONTACT_COLOR = "#38bdf8";
const DIM_COLOR = "#3f3f46";

interface SizedNode extends GraphNode {
  val: number;
}

function endpointId(endpoint: LinkObject["source"]): string {
  return typeof endpoint === "object" && endpoint !== null
    ? String((endpoint as { id?: string }).id)
    : String(endpoint);
}

export function TeiaGraph3D({
  nodes,
  links,
  rootId,
  allowRequest = false,
  onRequest,
  requestPending = false,
}: {
  nodes: GraphNode[];
  links: GraphLink[];
  rootId?: string;
  allowRequest?: boolean;
  onRequest?: (contactId: string) => void;
  requestPending?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const fgRef = useRef<ForceGraphMethods | undefined>(undefined);
  const [size, setSize] = useState({ width: 800, height: 600 });
  const [selected, setSelected] = useState<GraphNode | null>(null);

  useEffect(() => {
    function updateSize() {
      if (!containerRef.current) return;
      setSize({
        width: containerRef.current.clientWidth,
        height: containerRef.current.clientHeight,
      });
    }
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  const graphData = useMemo(() => {
    const outDegree = new Map<string, number>();
    for (const link of links) {
      outDegree.set(link.source, (outDegree.get(link.source) ?? 0) + 1);
    }
    const sizedNodes: SizedNode[] = nodes.map((n) => ({ ...n, val: outDegree.get(n.id) ?? 0 }));
    return { nodes: sizedNodes, links };
  }, [nodes, links]);

  const descendants = useMemo(() => {
    if (!selected) return [] as SizedNode[];
    const childrenByParent = new Map<string, string[]>();
    for (const link of graphData.links) {
      const sourceId = endpointId(link.source as LinkObject["source"]);
      const targetId = endpointId(link.target as LinkObject["source"]);
      const list = childrenByParent.get(sourceId) ?? [];
      list.push(targetId);
      childrenByParent.set(sourceId, list);
    }

    const visited = new Set<string>();
    const queue = [selected.id];
    while (queue.length > 0) {
      const current = queue.shift()!;
      for (const childId of childrenByParent.get(current) ?? []) {
        if (!visited.has(childId)) {
          visited.add(childId);
          queue.push(childId);
        }
      }
    }

    const byId = new Map(graphData.nodes.map((n) => [n.id, n]));
    return [...visited].map((id) => byId.get(id)).filter((n): n is SizedNode => Boolean(n));
  }, [selected, graphData]);

  const highlightSet = useMemo(() => {
    if (!selected) return null;
    return new Set([selected.id, ...descendants.map((n) => n.id)]);
  }, [selected, descendants]);

  function isLinkHighlighted(link: LinkObject): boolean {
    if (!highlightSet) return false;
    return (
      highlightSet.has(endpointId(link.source as LinkObject["source"])) &&
      highlightSet.has(endpointId(link.target as LinkObject["source"]))
    );
  }

  useEffect(() => {
    const fg = fgRef.current;
    if (!fg) return;

    fg.d3Force("charge")?.strength(-140);
    fg.d3Force("link")?.distance(60);
    fg.d3Force("center")?.strength(0.8);

    const scene = fg.scene();
    scene.fog = new THREE.Fog(0x0a0a0a, 220, 900);
    scene.add(new THREE.AmbientLight(0xffffff, 0.55));

    const controls = fg.controls() as { autoRotate: boolean; autoRotateSpeed: number };
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.6;

    const stopAutoRotate = () => {
      controls.autoRotate = false;
    };
    const container = containerRef.current;
    container?.addEventListener("pointerdown", stopAutoRotate, { once: true });
    container?.addEventListener("wheel", stopAutoRotate, { once: true });

    return () => {
      container?.removeEventListener("pointerdown", stopAutoRotate);
      container?.removeEventListener("wheel", stopAutoRotate);
    };
  }, []);

  return (
    <div className="relative flex-1 overflow-hidden rounded-xl border border-border bg-black">
      <div ref={containerRef} className="h-full w-full">
        <ForceGraph3D
          ref={fgRef}
          graphData={graphData}
          width={size.width}
          height={size.height}
          backgroundColor="#0a0a0a"
          nodeThreeObject={(node: object) => {
            const n = node as SizedNode;
            const isRoot = rootId !== undefined && n.id === rootId;
            const isSelected = n.id === selected?.id;
            const dimmed = highlightSet !== null && !highlightSet.has(n.id);
            const baseColor = isRoot ? ROOT_COLOR : n.type === "user" ? USER_COLOR : CONTACT_COLOR;
            const radius = isRoot ? 9 : 4 + Math.min(n.val, 8) * 1.5;
            const finalRadius = isSelected ? radius * 1.3 : radius;

            const group = new THREE.Group();
            const sphere = new THREE.Mesh(
              new THREE.SphereGeometry(finalRadius, 16, 16),
              new THREE.MeshLambertMaterial({
                color: dimmed ? DIM_COLOR : baseColor,
                transparent: true,
                opacity: dimmed ? 0.35 : 0.92,
              }),
            );
            group.add(sphere);

            const sprite = new SpriteText(n.name);
            sprite.color = dimmed ? "#71717a" : "#f8fafc";
            sprite.textHeight = isRoot ? 4.6 : isSelected ? 3.8 : 3.2;
            sprite.position.set(0, finalRadius + 4, 0);
            group.add(sprite);

            return group;
          }}
          linkColor={(link: object) =>
            isLinkHighlighted(link as LinkObject) ? "rgba(249,115,22,0.9)" : "rgba(255,255,255,0.2)"
          }
          linkWidth={(link: object) => (isLinkHighlighted(link as LinkObject) ? 1.6 : 0.5)}
          linkDirectionalParticles={(link: object) =>
            isLinkHighlighted(link as LinkObject) ? 4 : 2
          }
          linkDirectionalParticleWidth={1.4}
          linkDirectionalParticleSpeed={0.006}
          enableNodeDrag
          onNodeClick={(n: object) => setSelected(n as GraphNode)}
          onBackgroundClick={() => setSelected(null)}
        />
      </div>

      {selected && (
        <Card className="absolute right-4 top-4 w-72 gap-3 bg-card/95 p-4 backdrop-blur">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-primary" />
              <p className="text-sm font-medium">{selected.name}</p>
            </div>
            <button
              onClick={() => setSelected(null)}
              className="text-muted-foreground hover:text-foreground"
              aria-label="Fechar"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          {selected.field && (
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Building2 className="h-3.5 w-3.5" /> {selected.field}
            </p>
          )}
          {selected.city && (
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <MapPin className="h-3.5 w-3.5" /> {selected.city}
            </p>
          )}
          {allowRequest && selected.type === "contact" && (
            <Button size="sm" disabled={requestPending} onClick={() => onRequest?.(selected.id)}>
              <Share2 className="mr-1.5 h-3.5 w-3.5" /> Solicitar apresentação
            </Button>
          )}
          {descendants.length > 0 && (
            <div className="space-y-1.5 border-t border-border pt-2.5">
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                {descendants.length} contato{descendants.length > 1 ? "s" : ""} a partir dele
              </p>
              <div className="max-h-72 space-y-1.5 overflow-y-auto pr-1">
                {descendants.map((n) => (
                  <div
                    key={n.id}
                    className="space-y-1.5 rounded-lg border border-border/60 bg-background/60 p-2.5"
                  >
                    <div className="flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5 shrink-0 text-primary" />
                      <p className="truncate text-xs font-medium">{n.name}</p>
                    </div>
                    {n.field && (
                      <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                        <Building2 className="h-3 w-3 shrink-0" /> {n.field}
                      </p>
                    )}
                    {n.city && (
                      <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                        <MapPin className="h-3 w-3 shrink-0" /> {n.city}
                      </p>
                    )}
                    {allowRequest && n.type === "contact" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 w-full text-[11px]"
                        disabled={requestPending}
                        onClick={() => onRequest?.(n.id)}
                      >
                        <Share2 className="mr-1.5 h-3 w-3" /> Solicitar apresentação
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
