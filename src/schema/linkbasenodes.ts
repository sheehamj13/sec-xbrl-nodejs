
const xlinkNS = 'http://www.w3.org/1999/xlink';



export class LabelNode {

    private _label: string;          // lab_elementname
    private _role: string;
    private _type: string;
    private _lang: string;
    public readonly Text: string;

    public readonly MatchingElement: string;

    constructor(element: Element) {
        this._label = element.getAttributeNS(xlinkNS, 'label');
        this._role = element.getAttributeNS(xlinkNS, 'role');
        this._type = element.getAttributeNS(xlinkNS, 'type');
        this._lang = element.getAttributeNS(null, 'lang');              // ?? what is this namespace

        this.Text = element.firstChild.nodeValue;

        this.MatchingElement = this._label.substring('lab_'.length);
    }

}





const preferredLabel = 'http://www.xbrl.org/2003/role/totalLabel';
const arcrole = 'http://www.xbrl.org/2003/arcrole/parent-child';


export class PresentationLink {
    public readonly nodes: Presentation[];
    private _nameMap: Map<string, Presentation>;

    private _parents = new Map<string, PresentationArcNode[]>();

    constructor() {
        this.nodes = [];
        this._nameMap = new Map<string, Presentation>();
    }

    public addPresentationNode(node: Presentation) {
        this.nodes.push(node);
        this._nameMap.set(node.Name, node);
    }

    public addArcNode(node: PresentationArcNode) {
        if (this._parents.has(node.ParentName)) {
            this._parents.get(node.ParentName).push(node);
        }
        else {
            this._parents.set(node.ParentName, [node]);
        }
    }

    public sort() {
        this._parents.forEach((arcs: PresentationArcNode[]) => {
            for (let arc of arcs) {
                if (arc.isTotal) {
                    let pres = this._nameMap.get(arc.Name);
                    pres.isTotal = true;
                }
            }
        });

        for (let pres of this.nodes) {
            // check if this node is a parent
            if (!this._parents.has(pres.Name)) continue;

            // get all the names of the children nodes for this node
            let arcs = this._parents.get(pres.Name);

            for (let arc of arcs) {
                if (!this._nameMap.has(arc.Name)) continue;

                // get the presentation node of this child
                let child = this._nameMap.get(arc.Name);
                
                child.Parent = pres.Name;
                pres.Children.push(child.Name);

                // pres.isTotal = arc.isTotal;
            }
        }
    }

    // public root() {
    //     let root = this._presentations[0];
    //     while (root.Parent !== null) {
    //         root = root.Parent;
    //     }
    //     return root;
    // }
    // public nodes() {
    //     return this._presentations;
    // }
}


export class Presentation {

    public readonly Name: string;
    public isTotal: boolean = false;

    public Parent: string;
    public Children: string[];
    // public Parent: Presentation;
    // public Children: Presentation[];

    // public get ParentName() { return this.Parent.Name; }
    // public get ChildrenNames() { return this.Children.map((child: Presentation) => { return child.Name; }); }

    constructor(name: string) {
        this.Name = name;

        this.Parent = null;
        this.Children = [];
    }
}

// export class PresentationLocationNode {

//     public readonly href: string;
//     public readonly label: string;

//     public readonly Name: string;


//     constructor(element: Element) {
//         this.href = element.getAttributeNS(xlinkNS, 'href');
//         this.label = element.getAttributeNS(xlinkNS, 'label');

//         this.Name = this.label.substr('loc_'.length);
//     }
// }

export class PresentationArcNode {

    public preferredLabel: string;              // totalLabel?
    public role: string;                        // parent-child
    public from: string;
    public to: string;

    public readonly ParentName: string;
    public readonly Name: string;

    public readonly isTotal: boolean;

    constructor(element: Element) {
        this.from = element.getAttributeNS(xlinkNS, 'from');
        this.to = element.getAttributeNS(xlinkNS, 'to');

        this.role = element.getAttributeNS(xlinkNS, 'arcrole');
        this.preferredLabel = element.getAttributeNS(null, 'preferredLabel');

        this.ParentName = this.from.substr('loc_'.length);
        this.Name = this.to.substr('loc_'.length);


        // check if this is a 'total' sum node
        this.isTotal = false;

        if (this.preferredLabel && this.preferredLabel.match(/totalLabel/ig)) {
            this.isTotal = true;
        }
    }

}