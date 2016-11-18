import XBRL from './xbrl/xbrl';

import API from './api/api';
import { DOMParser } from 'xmldom';

import SchemaParser from './schema/schemaparser';
import { SchemaDocument, ElementNode } from './schema/schemanodes'; 
import { LabelNode, PresentationLink, Presentation } from './schema/linkbasenodes';

import { EntityInfoXBRL as EntityInfo } from './xbrl/statements/entityinformation';
import { EntityModel } from './models/entitymodel';
import { StatementNode, StatementGaapNode, StatementDeiNode } from './xbrl/statements/statementnode';
import { CreateStatementNodes, PullStatementNodes, SelectNodes, SelectDeiNodes, MatchPresentation } from './xbrl/statements/balancesheet/balancesheetnode';
import { FormatBalanceSheetMoney, FormatBalanceSheetShares } from './xbrl/statements/balancesheet/balancesheetformat';

import nunjucks = require('nunjucks');
import path = require('path');
import fs from './utilities/filesystem';

let isRelease = process.env.NODE_ENV === 'release';


// let price = YahooAPI.GetPrice('AAPL', '2012-01-01', '2012-01-01');
// price.then((result: YahooAPI.Result) => {
//     let r = result;
// });

// let historicalPrice = YahooAPI.GetHistoricalPrice('AAPL', '2012-01-01', '2012-01-01');
// historicalPrice.then((result: YahooAPI.Result) => {

// });

// YahooAPI.GetGPrice();
// YahooAPI.csv.GetPrice(['AAPL', 'GOOG']);


// API.Get('http://xbrl.sec.gov/dei/2014/dei-2014-01-31.xsd').then((data: string) => {
//     let DEI_SCHEMA = path.join(process.cwd(), './us-gaap-2016-01-31/dei-2014-01-31.xsd');
//     return fs.WriteFile(DEI_SCHEMA, data);
// }).then(() => {
//     console.log('wrote dei output');
// });

export module DEI {
    export const ELEMENT_SCHEMA = path.join(process.cwd(), './dei-2014-01-31/dei-2014-01-31.xsd');
    export const LABEL_SCHEMA = path.join(process.cwd(), './dei-2014-01-31/dei-lab-2014-01-31.xml');
    export const PRESENTATION_SCHEMA = path.join(process.cwd(), './dei-2014-01-31/dei-pre-2014-01-31.xml');
}
export module GAAP {
    export const ELEMENT_SCHEMA = path.join(process.cwd(), './us-gaap-2016-01-31/elts/us-gaap-2016-01-31.xsd');
    export const LABEL_SCHEMA = path.join(process.cwd(), './us-gaap-2016-01-31/elts/us-gaap-lab-2016-01-31.xml');
    export const SFP_CLASSIFIED_PRESENTATION_SCHEMA = path.join(process.cwd(), './us-gaap-2016-01-31/stm/us-gaap-stm-sfp-cls-pre-2016-01-31.xml');
    export const SOI_PRESENTATION_SCHEMA = path.join(process.cwd(), './us-gaap-2016-01-31/stm/us-gaap-stm-soi-pre-2016-01-31.xml');
}


let parser = new DOMParser();

let DEISchema: SchemaDocument;
let DEILabels: LabelNode[];
let DEIPresentation: PresentationLink[];

let GaapSchema: SchemaDocument;
let GaapLabels: LabelNode[];
let sfp_cls_presentation: PresentationLink[];
let soi_presentation: PresentationLink[];


// Parse DEI schema
let dei = fs.ReadFile(DEI.ELEMENT_SCHEMA).then<string>((data: string) => {
    let document = parser.parseFromString(data);
    DEISchema = SchemaParser.ParseDocument(document);

    return fs.ReadFile(DEI.LABEL_SCHEMA);
});
dei = dei.then<string>((data: string) => {
    let document = parser.parseFromString(data);
    DEILabels = SchemaParser.ParseLabels(document);

    return fs.ReadFile(DEI.PRESENTATION_SCHEMA);
});
dei = dei.then<void>((data: string) => {
    let document = parser.parseFromString(data);

    // TODO: handle multiple presentationLink's
    // TODO: match roleRef's with presentationLink's
    DEIPresentation = SchemaParser.ParsePresentation(document);
});
// dei = dei.then<void>(() => {
//     // to quickly match elements with their labels and presentation 
//     let elementNames = GaapSchema.Elements.map((node: ElementNode) => { return node.name; });
//     let labelNames = GaapLabels.map((node: LabelNode) => { return node.MatchingElement; });

//     // find the root node
//     // should be `StatementOfFinancialPositionAbstract`
//     let sfpRoot = CreateNodes(sfp_cls_presentation, elementNames, labelNames);
//     console.log(sfpRoot.element.name);


//     // Parse the xbrl data
//     // and create the statments from the xbrl data
//     console.log('parsing xbrl data');
//     let xbrl = new XBRL(parser.parseFromString(data));

//     // let entity = Report.CreateEntityInformation(xbrl);
//     let entity = new EntityModel({
//         registrantName: EntityInfo.RegistrantName(xbrl),
//         centralIndexKey: EntityInfo.CentralIndexKey(xbrl),
//         documentType: EntityInfo.DocumentType(xbrl),
//         focusPeriod: EntityInfo.DocumentFocusPeriod(xbrl),
//         yearFocus: EntityInfo.DocumentYearFocus(xbrl),
//         documentDate: EntityInfo.DocumentEndDate(xbrl),
//         amendment: EntityInfo.Amendment(xbrl)
//     });
// });


// Parse GAAP schema
let gaap = fs.ReadFile(GAAP.ELEMENT_SCHEMA).then<string>((data: string) => {
    let document = parser.parseFromString(data);
    GaapSchema = SchemaParser.ParseDocument(document);

    return fs.ReadFile(GAAP.LABEL_SCHEMA);
});
// Parse labels schema
gaap = gaap.then<string>((data: string) => {
    let document = parser.parseFromString(data);
    GaapLabels = SchemaParser.ParseLabels(document);

    return fs.ReadFile(GAAP.SFP_CLASSIFIED_PRESENTATION_SCHEMA);
});
// Parse sfp presentation
gaap = gaap.then<string>((data: string) => {
    let document = parser.parseFromString(data);
    sfp_cls_presentation = SchemaParser.ParsePresentation(document);

    return fs.ReadFile(GAAP.SOI_PRESENTATION_SCHEMA);
});
// parse soi presentation
gaap = gaap.then<string>((data: string) => {
    let document = parser.parseFromString(data);
    soi_presentation = SchemaParser.ParsePresentation(document);

    return fs.ReadFile(path.join(process.cwd(), './test/cvs2/cvs-20141231.xml'));
});


let render = Promise.all([gaap, dei]).then<string>(() => {
    // after parsing the schemas, we can parse an xbrl instance document
    return fs.ReadFile(path.join(process.cwd(), './test/cvs2/cvs-20141231.xml'));
});
render = render.then<string>((data: string) => {
    // Parse the xbrl data
    // and create the statments from the xbrl data
    console.log('parsing xbrl data');
    let xbrl = new XBRL(parser.parseFromString(data));


    // pair up elements with their labels
    let dei = CreateStatementNodes(DEISchema.Elements, DEILabels);


    // DEI Sheet
    console.log('starting dei document');
    let documentNodes = PullStatementNodes(DEIPresentation[0].nodes, dei.map);
    let documentValues = SelectDeiNodes(documentNodes, xbrl);

    // TODO: remove entity model
    // TODO: handle multiple statement presentation tables
    // TODO: ignore the presentation for now...

    
    MatchPresentation(DEIPresentation[0].nodes, documentValues);
    // console.log(`DEI Root: ${deiRoot.element.name}`);
    
    // console.log('consolidating dei table');
    // let deiSheet = ConsolidateDocumentTable(xbrl, deiRoot);
    

    let entity = new EntityModel({
        registrantName: EntityInfo.RegistrantName(xbrl)[0].value,
        centralIndexKey: EntityInfo.CentralIndexKey(xbrl)[0].value,
        documentType: EntityInfo.DocumentType(xbrl)[0].value,
        focusPeriod: EntityInfo.DocumentFocusPeriod(xbrl)[0].value,
        yearFocus: EntityInfo.DocumentYearFocus(xbrl)[0].value,
        documentDate: EntityInfo.DocumentEndDate(xbrl)[0].value,
        amendment: EntityInfo.Amendment(xbrl)[0].value
    });



    // TODO: seperate the values from the tables
    //       1. create statement nodes
    //       2. seperate the working statement nodes from the total nodes
    //       3. pair the statement nodes with their values
    //       4. then format the nodes

    // pair up elements with their labels
    let gaap = CreateStatementNodes(GaapSchema.Elements, GaapLabels);


    // Balance Sheet
    console.log('starting balance sheet...');
    let balanceSheetNodes = PullStatementNodes(sfp_cls_presentation[0].nodes, gaap.map);
    let balanceSheetValues = SelectNodes(balanceSheetNodes, xbrl);

    const moneyType = 'xbrli:monetaryItemType';
    const stringType = 'xbrli:stringItemType';
    const sharesType = 'xbrli:sharesItemType';
    const perShareType = 'num:perShareItemType';

    let moneyValues: StatementGaapNode[] = [];
    let shareValues: StatementGaapNode[] = [];

    for (let value of balanceSheetValues) {
        if (moneyType === value.element.type || stringType === value.element.type) {
            moneyValues.push(value);
        }
        else {
            shareValues.push(value);
        }
    }

    console.log('matching balance sheet presentation');
    MatchPresentation(sfp_cls_presentation[0].nodes, moneyValues);
    // console.log('consolidating balance sheet table');
    // let balanceSheet = ConsolidateBalanceSheetTable(xbrl, sfpRoot);
    console.log('formatting balance sheet');
    let balanceSheetMoney = FormatBalanceSheetMoney(entity, moneyValues);
    let balanceSheetShares = FormatBalanceSheetShares(entity, shareValues);


    // // find the root node
    // // should be `StatementOfFinancialPositionAbstract`
    // console.log('starting balance sheet...');
    // let sfpRoot = MatchStatementPresentation(sfp_cls_presentation[0].root(), balanceSheetNodes);
    // console.log('consolidating balance sheet table');
    // let balanceSheet = ConsolidateBalanceSheetTable(xbrl, sfpRoot);
    // console.log('formatting balance sheet');
    // let balanceSheetMoney = FormatBalanceSheet(entity, sfpRoot, balanceSheet.money);
    // let balanceSheetShares = FormatBalanceSheet(entity, sfpRoot, balanceSheet.shares);



    // Income Statement
    console.log('starting income statement...');
    let incomeStatementNodes = PullStatementNodes(soi_presentation[0].nodes, gaap.map);
    let incomeStatementValues = SelectNodes(incomeStatementNodes, xbrl);

    console.log('matching income statement presentation');
    MatchPresentation(soi_presentation[0].nodes, incomeStatementValues);

    console.log('formatting income statement');
    let incomeStatementMoney = FormatBalanceSheetMoney(entity, incomeStatementValues);

    // // create income statement tables
    // console.log('starting income statement...');
    // let soiRoot = MatchStatementPresentation(soi_presentation[0].root(), incomeStatementNodes);
    // console.log('consolidating income statement table');
    // let incomeStatement = ConsolidateStatementTable(xbrl, soiRoot);
    // console.log('formatting income statement');
    // let incomeStatementFormat = FormatBalanceSheet(entity, soiRoot, incomeStatement);


    return renderNunjucks(
        path.join(process.cwd(), './templates/index.html'),
        ['.', './templates/'],
        {
            entity: entity,
            sfp: {
                money: balanceSheetMoney,
                shares: balanceSheetShares
            },
            soi: {
                // income: incomeStatementFormat
                income: incomeStatementMoney
            }
        }
    );
});
render = render.then((html: string) => {
    return fs.WriteFile(path.join(process.cwd(), './output/cvs-20141231.html'), html);
});
render = render.then(() => {
    console.log('Wrote output.');
});


// export function MatchDEINodes(root: Presentation, elementNames: string[], labelNames: string[]) {
//     // find matching element
//     let index = elementNames.indexOf(root.Name);
//     let element = index !== -1 ? DEISchema.Elements[index] : null;

//     // find matching label
//     index = labelNames.indexOf(root.Name);
//     let label = index !== -1 ? DEILabels[index] : null;


//     let stmntNode = new StatementNode({
//         element: element,
//         label: label
//     });

//     for (let child of root.Children) {
//         let childStmntNode = MatchDEINodes(child, elementNames, labelNames);

//         childStmntNode.parent = stmntNode;
//         stmntNode.children.push(childStmntNode);
//     }
//     return stmntNode;    
// }
// export function MatchGaapNodes(root: Presentation, elementNames: string[], labelNames: string[]) {
//     // find matching element
//     let index = elementNames.indexOf(root.Name);
//     let element = index !== -1 ? GaapSchema.Elements[index] : null;

//     // find matching label
//     index = labelNames.indexOf(root.Name);
//     let label = index !== -1 ? GaapLabels[index] : null;


//     let stmntNode = new StatementNode({
//         element: element,
//         label: label
//     });

//     for (let child of root.Children) {
//         let childStmntNode = MatchGaapNodes(child, elementNames, labelNames);

//         childStmntNode.parent = stmntNode;
//         stmntNode.children.push(childStmntNode);
//     }

//     return stmntNode;
// }


function renderNunjucks(inputFilePath: string, searchRelativePaths: string[], context: any): Promise<string> {
    let read = fs.ReadFile(inputFilePath);
    read = read.then((data: string) => {
        let env = nunjucks.configure(searchRelativePaths, {
            autoescape: true,
            trimBlocks: false,
            lstripBlocks: false
        });

        return new Promise<string>((resolve: Function, reject: Function) => {
            env.renderString(data, context, (err: any, res: string) => {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(res);
                }
            });
        });
    });
    return read;
}



// gaap = gaap.then((data: string) => {
//     // TODO: match elements with labels before continuing?

//     // to quickly match elements with their labels and presentation 
//     let elementNames = GaapSchema.Elements.map((node: ElementNode) => { return node.name; });
//     let labelNames = GaapLabels.map((node: LabelNode) => { return node.MatchingElement; });

//     // find the root node
//     // should be `StatementOfFinancialPositionAbstract`
//     let sfpRoot = CreateNodes(sfp_cls_presentation, elementNames, labelNames);
//     console.log(sfpRoot.element.name);


//     // Parse the xbrl data
//     // and create the statments from the xbrl data
//     console.log('parsing xbrl data');
//     let xbrl = new XBRL(parser.parseFromString(data));

//     // let entity = Report.CreateEntityInformation(xbrl);
//     let entity = new EntityModel({
//         registrantName: EntityInfo.RegistrantName(xbrl),
//         centralIndexKey: EntityInfo.CentralIndexKey(xbrl),
//         documentType: EntityInfo.DocumentType(xbrl),
//         focusPeriod: EntityInfo.DocumentFocusPeriod(xbrl),
//         yearFocus: EntityInfo.DocumentYearFocus(xbrl),
//         documentDate: EntityInfo.DocumentEndDate(xbrl),
//         amendment: EntityInfo.Amendment(xbrl)
//     });

//     // create balance sheet tables
//     console.log('consolidating balance sheet table');
//     let balanceSheet = ConsolidateBalanceSheetTable(xbrl, sfpRoot);

//     console.log('formatting balance sheet');
//     let balanceSheetMoney = FormatBalanceSheet(entity, sfpRoot, balanceSheet.money);
//     let balanceSheetShares = FormatBalanceSheet(entity, sfpRoot, balanceSheet.shares);

//     // create income statement tables
//     console.log('consolidating income statement table');
//     let soiRoot = CreateNodes(soi_presentation, elementNames, labelNames);
//     let incomeStatement = ConsolidateIncomeStatementTable(xbrl, soiRoot);
//     console.log('formatting income statement');
//     let incomeStatementFormat = FormatBalanceSheet(entity, soiRoot, incomeStatement);


//     return renderNunjucks(
//         path.join(process.cwd(), './templates/index.html'),
//         ['.', './templates/'],
//         {
//             entity: entity,
//             sfp: {
//                 money: balanceSheetMoney,
//                 shares: balanceSheetShares
//             },
//             soi: {
//                 income: incomeStatementFormat
//             }
//         }
//     );
// });
// gaap = gaap.then((html: string) => {
//     return fs.WriteFile(path.join(process.cwd(), './output/cvs-20141231.html'), html);
// });
// gaap = gaap.then(() => {
//     console.log('Wrote output.');
// });


// // After parsing the schema(s), we are now ready to parse any 2016 xbrl balance sheet
// schema = schema.then((data: string) => {
//     let xbrl = new XBRL(parser.parseFromString(data));


//     // to quickly match elements with their labels and presentation 
//     let elementNames = elements.map((node: ElementNode) => { return node.name; });
//     let labelNames = labels.map((node: LabelNode) => { return node.MatchingElement; });

//     // let presNames = presentations.map((node: PresentationArcNode) => { return node.Name; });


//     // create statement nodes
//     let balanceSheetMap = new Map<ElementNode, BalanceSheetNode>();
//     let balanceSheet: BalanceSheetNode[] = [];
//     let parentChildren = new Map<ElementNode, BalanceSheetNode[]>();

//     // loop through presentation nodes
//     // (we only want the balance sheet for now, so we can use the presentation location nodes)
//     for (let loc of locations) {
//         // find matching element
//         let elementIndex = elementNames.indexOf(loc.Name);
//         let element = elementIndex !== -1 ? elements[elementIndex] : null;

//         // find matching label
//         let labelIndex = labelNames.indexOf(loc.Name);
//         let label = labelIndex !== -1 ? labels[labelIndex] : null;

//         let presIndex = presNames.indexOf(loc.Name);
//         let pres = presIndex !== -1 ? presentations[presIndex] : null;


//         // create balance sheet node
//         let balanceSheetNode: BalanceSheetNode;
//         if (balanceSheetMap.has(element)) {
//             balanceSheetNode = balanceSheetMap.get(element);
//         }
//         else {
//             balanceSheetNode = new BalanceSheetNode({
//                 element: element,
//                 label: label
//                 // presentation: pres
//                 // location: loc
//             });
//             balanceSheetMap.set(element, balanceSheetNode);
//             balanceSheet.push(balanceSheetNode);
//         }


//         if (pres !== null) {
//             // find the parent node
//             let index = elementNames.indexOf(pres.ParentName);
//             let parent = elements[index];

//             if (parentChildren.has(parent)) {
//                 parentChildren.get(parent).push(balanceSheetNode);
//             }
//             else {
//                 parentChildren.set(parent, [balanceSheetNode]);
//             }
//         }
//     }


//     // match up children
//     for (let node of balanceSheet) {
//         if (parentChildren.has(node.element)) {
//             let children = parentChildren.get(node.element);

//             for (let child of children) {
//                 child.parent = node;
//                 node.children.push(child);

//                 // if (child.presentation && child.presentation.isTotal) {

//                 // }
//             }
//         }
//     }


//     // find the root node
//     // should be `StatementOfFinancialPositionAbstract`
//     let root = balanceSheet[0];
//     while (root.parent !== null) {
//         root = root.parent;
//     }
//     console.log(root.element.name);
    

//     console.log('creating balance sheet');

//     let entity = Report.CreateEntityInformation(xbrl);

//     let lines = ConsolidateBalanceSheetTable(xbrl, root);
//     let balanceSheetData = BalanceSheetFormat(entity, root, lines);


//     return renderNunjucks(
//         path.join(process.cwd(), './templates/index.html'),
//         ['.', './templates/'],
//         balanceSheetData
//     );
// });
// schema = schema.then((html: string) => {
//     return fs.WriteFile(path.join(process.cwd(), './output/cvs-20141231.html'), html);
// });
// schema = schema.then(() => {
//     console.log('Wrote output.');
// });


// let read = fs.ReadFile(path.join(process.cwd(), './test/cvs2/cvs-20141231.xml'));
// read = read.then((data: string) => {
//     let xbrl = XBRLLoader.GetXBRLFromString(data);

//     let balanceSheets = Report.CreateBalanceSheet(xbrl);
//     let financialPositions = Report.CreateFinancialPosition(xbrl);

//     return renderNunjucks(path.join(process.cwd(), './templates/index.html'), ['.', './templates/'], {
//         entity: Report.CreateEntityInformation(xbrl),
//         balanceSheets: balanceSheets,
//         financials: financialPositions
//     });
// });
// read = read.then((html: string) => {
//     return fs.WriteFile(path.join(process.cwd(), './output/cvs-20141231.html'), html);
// });
// read.then(() => {
//     console.log('Wrote output.');
// });



// // Example
// let cvsCIK = '0000064803';
// let cvsTicker = 'CVS';
// let cvsXBRL: XBRL;


// let load: Promise<any> = Test.Load(cvsCIK);
// load = load.then((xbrlSets: XBRL[]) => {
//     let reports: TenK[] = [];

//     for (let xbrl of xbrlSets) {
//         let tenk = Report.Create10K(xbrl);
//         reports.push(tenk);
//     }

//     let r = reports;
// });


// let yahoo = YahooAPI.GetHistoricalPrice('CVS', '2010-01-02', '2010-01-02');
// yahoo.then((value: YahooAPI.HistoricalResult) => {
    
// });


// let load: Promise<any> = Test.Get10KFilings(cvsTicker);
// load = load.then((filings: SECFiling[]) => {
//     // the first form will be the latest 10-K
//     let filing = filings[0];
//     return Test.GetForms(filing.url);
// });
// load = load.then((forms: SECDocument[]) => {
//     let form: SECDocument;
//     for (let f of forms) {
//         if (f.type.match(/.INS$/gi)) {
//             form = f;
//             break;
//         }
//     }
//     return Test.GetXBRL(form.url);
// });
// load = load.then((xbrl: XBRL) => {
//     cvsXBRL = xbrl;
//     return Test.GetPrice(cvsTicker);
// });
// load = load.then((value: YahooAPI.QuoteResult) => {
//     let tenk = AnnualReport.Create10K(cvsXBRL, cvsXBRL.years[0]);
//     let tenk2013 = AnnualReport.Create10K(cvsXBRL, cvsXBRL.years[1]);
//     let tenk2012 = AnnualReport.Create10K(cvsXBRL, cvsXBRL.years[2]);


//     let price = parseFloat((<YahooAPI.Quote>value.query.results.quote).Bid);

//     let priceToEarnings = price / tenk.EarningsPerShare;
//     let marketCap = price * tenk.OutstandingShares;
//     let dividendYield = tenk.DeclaredDividend / price;

//     let workingCapital = Finance.CalcWorkingCapital(tenk.CurrentAssets, tenk.CurrentLiabiliites);
//     let profitMargin = Finance.CalcProfitMargin(tenk.NetIncome, tenk.TotalRevenue);
//     let currentAssetsToCurrentLiab = Finance.CalcCurrentAssetsRatio(tenk.CurrentAssets, tenk.CurrentLiabiliites);
//     let workingCapitalToLongTermDebt = Finance.CalcWorkingCapitalToDebtRatio(workingCapital, tenk.LongTermDebt);


//     let minYear = Math.min(tenk.Year, tenk2012.Year, tenk2013.Year);
//     let maxYear = Math.max(tenk.Year, tenk2012.Year, tenk2013.Year);
//     let averageEarningsPerShare = Finance.CalcAverageEarningsPerShare([tenk, tenk2013, tenk2012]);
//     let averageDilutedEarningsPerShare = Finance.CalcAverageDilutedEarningsPerShare([tenk, tenk2013, tenk2012]);


//     process.stdout.write('\r\n');
//     // capitalization
//     process.stdout.write(`Price/Earnings (${tenk.Year}): ${priceToEarnings} \r\n`);
//     process.stdout.write(`Outstanding Common Shares (${tenk.Year}): ${tenk.OutstandingShares} \r\n`);
//     process.stdout.write(`Diluted Outstanding Common Shares (${tenk.Year}): ${tenk.DilutedOutstandingShares} \r\n`);
//     process.stdout.write(`Market Capitalization (${tenk.Year}): ${marketCap} \r\n`);

//     // income
//     process.stdout.write(`Total Revenue (${tenk.Year}): ${tenk.TotalRevenue} \r\n`);
//     process.stdout.write(`Net Income (${tenk.Year}): ${tenk.NetIncome} \r\n`);
//     process.stdout.write(`Earnings/Share (${tenk.Year}): ${tenk.EarningsPerShare} \r\n`);
//     process.stdout.write(`Diluted Earnings/Share (${tenk.Year}): ${tenk.DilutedEarningsPerShare} \r\n`);
//     process.stdout.write(`Dividend Rate (${tenk.Year}): ${tenk.DeclaredDividend} \r\n`);

//     // balance sheet
//     process.stdout.write(`Current Assets (${tenk.Year}): ${tenk.CurrentAssets} \r\n`);
//     process.stdout.write(`Current Liabilities (${tenk.Year}): ${tenk.CurrentLiabiliites} \r\n`);
//     process.stdout.write(`Long-Term Debt (${tenk.Year}): ${tenk.LongTermDebt} \r\n`);
//     process.stdout.write(`Outstanding Preferred Shares (${tenk.Year}): ${tenk.PrefOutstandingShares} \r\n`);
//     process.stdout.write(`Working Capital (${tenk.Year}): ${workingCapital} \r\n`);

//     // ratios


//     process.stdout.write('\r\n');
//     process.stdout.write(`Average Earnings/Share (${minYear}-${maxYear}): ${averageEarningsPerShare} \r\n`);
//     process.stdout.write(`Average Diluted Earnings/Share (${minYear}-${maxYear}): ${averageDilutedEarningsPerShare} \r\n`);

// });





// function Select(element: string, doc: Document) {
//     let nodes: any[] = []

//     let select = xpath.select(`//*[local-name() = '${element}']`, doc);
//     for (let i = 0; i < select.length; i++) {
//         let node = select[i];
//         if (node.prefix === 'us-gaap') {
//             nodes.push(node);
//         }
//     }
//     return nodes
// }
// function GetYear(date: string) {
//     let match: RegExpMatchArray;
//     let year = -1;

//     if (match = date.match(/^from_([a-z]+\d{2})_(\d{4})_to_([a-z]+\d{2})_(\d{4})$/i)) {
//         let fromDate = Date.parse("" + match[1] + " " + match[2]);
//         if (!isNaN(fromDate)) {
//             let toDate = Date.parse("" + match[3] + " " + match[4]);
//             if (!isNaN(toDate)) {
//                 let day = 24 * 60 * 60 * 1000;
//                 let days = (toDate - fromDate) / day;
//                 if ((360 < days && days < 370)) {
//                     year = new Date(toDate).getFullYear();
//                 }
//             }
//         }
//     }
//     else if (match = date.match(/^d(\d{4})$/i)) {
//         year = parseInt(match[1]);
//     }
//     else if (match = date.match(/^d(\d{4})q(\d{1})(ytd)?$/i)) {
//         year = parseInt(match[1]);
//     }
//     // else if (match = date.match(/^FD(\d{4})Q(\d{1})YTD$/i)) {
//     //     year = parseInt(match[1]);
//     // }
//     else if (match = date.match(/^(?:FD|FI)(\d{4})Q4(YTD)?$/i)) {
//         year = parseInt(match[1]);
//     }

//     return year;
// }
// function GetYearShares(date: string) {
//     let match: RegExpMatchArray;
//     let year = -1;

//     if (match = date.match(/^FI(\d{4})Q4$/i)) {
//         year = parseInt(match[1]);
//     }

//     return year;
// }






// function getTags(data: string) {
//     var tags: any[] = [];

//     var tagSelector = function (el: any) {
//         if (el.type === 'tag' && el.children.length === 1) {
//             tags.push({
//                 name: el.name,
//                 attribs: el.attribs,
//                 data: el.children[0].data
//             });
//         }
//     }

//     let $ = cheerio.load(data);
//     // xmlRecurse($._root, tagSelector);
//     xmlRecurse($.root()[0], tagSelector);


//     return tags;
// }

// function xmlRecurse(el: any, cb: Function) {
//     // recurses through an xml document and applies callback to each element
//     cb(el);

//     let children = el.children;
//     if (children) {
//         el.children.forEach((child: any) => {
//             xmlRecurse(child, cb);
//         })
//     }
// };




// const publicationFields = {
//     EnterpriseNumber: {
//         normalize: (val: string) => {
//             if (!val) return;
//             const m = val.match(/^(?:BE)?(\d{4})\.?(\d{3})\.?(\d{3})$/)
//             return m ? `${m[1]}.${m[2]}.${m[3]}` : val
//         },
//         xPath: '//xbrli:xbrl/xbrli:context[@id="CurrentInstant"]/xbrli:entity/xbrli:identifier'
//     },
//     CurrentInstant: {
//         xPath: '//xbrli:xbrl/xbrli:context[@id="CurrentInstant"]/xbrli:period/xbrli:instant'
//     },
//     CurrentDurationStart: {
//         xPath: '//xbrli:xbrl/xbrli:context[@id="CurrentDuration"]/xbrli:period/xbrli:startDate'
//     },
//     CurrentDurationEnd: {
//         xPath: '//xbrli:xbrl/xbrli:context[@id="PrecedingDuration"]/xbrli:period/xbrli:endDate'
//     },
//     PrecedingInstant: {
//         xPath: '//xbrli:xbrl/xbrli:context[@id="PrecedingInstant"]/xbrli:period/xbrli:instant'
//     },
//     PrecedingDurationStart: {
//         xPath: '//xbrli:xbrl/xbrli:context[@id="PrecedingDuration"]/xbrli:period/xbrli:startDate'
//     },
//     PrecedingDurationEnd: {
//         xPath: '//xbrli:xbrl/xbrli:context[@id="PrecedingDuration"]/xbrli:period/xbrli:endDate'
//     }
// }
// const contextPeriods = [
//     'Current',
//     'Preceding'
// ]


// function firstChildData(node: any) {
//     if (node && node.firstChild) {
//         return node.firstChild.data || null;
//     }
//     return null;
// }

// let ns = xpath.useNamespaces({
//     xbrli: 'http://www.xbrl.org/2003/instance',
//     iso4217: 'http://www.xbrl.org/2003/iso4217',
//     link: 'http://www.xbrl.org/2003/linkbase',
//     pfs: 'http://www.nbb.be/be/fr/pfs/ci/2015-04-01',
//     xlink: 'http://www.w3.org/1999/xlink',
//     usgaap: 'http://fasb.org/us-gaap/2013-01-31'
// });
// function getPublicationData(x: string, doc: Document) {
//     let sl = ns(x, doc);
//     return firstChildData(sl[0]);
// }

// function getLedgerData(ledgerId: string, ledgerType: string, contextPeriod: string, doc: Document) {
//     const xPath = `//xbrli:xbrl/pfs:${ledgerId}[@contextRef="${contextPeriod}${ledgerType}"]`
//     const node = ns(xPath, doc)[0]

//     return node && {
//         LedgerId: ledgerId,
//         UnitRef: node.getAttribute('unitRef'),
//         Period: contextPeriod,
//         Amount: parseFloat(firstChildData(node))
//     }
// }


// function ParseXML(xml: string) {
//     const dom = new DOMParser();
//     const doc = dom.parseFromString(xml);

//     let publication: any = {};
//     let ledger: any[] = [];

//     for (const fieldName in publicationFields) {
//         const fieldMetadata = (<any>publicationFields)[fieldName]
//         const rawValue = getPublicationData(fieldMetadata.xPath, doc)
//         const normValue = fieldMetadata.normalize ? fieldMetadata.normalize(rawValue) : rawValue
//         publication[fieldName] = normValue
//     }

//     for (const ledgerType in ledgerTypes) {
//         for (const ledgerId of (<any>ledgerTypes)[ledgerType]) {
//             for (const contextPeriod of contextPeriods) {
//                 const data = getLedgerData(ledgerId, ledgerType, contextPeriod, doc)
//                 if (data) {
//                     ledger.push(data)
//                 }
//             }
//         }
//     }

//     console.log(JSON.stringify(publication));
//     return publication;
// }
