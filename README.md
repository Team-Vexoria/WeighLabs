<img width="1578" height="594" alt="weighlabs-github" src="https://github.com/user-attachments/assets/b20feb93-02eb-465b-8b09-792a72a4824b" />

# SIH Problem Statement

## Problem Title
Development of a Software Program/Application for Generation of Test Reports for Non-Automatic Weighing Instruments (NAWI) as per [OIML Recommendation R-76](https://www.oiml.org/en/files/pdf_r/r076-1-e06.pdf)

Data Set: https://consumeraffairs.gov.in/pages/legal-metrology-act and the Legal Metrology (General) Rules, 2011
## Problem Description Summary
Non Automated Weighing Instruments are weighing scales used in trade, commerce, healthcare, agriculture and other industries where accurate measurement is essential for fair transactions and consumer protection. For approving such machines, they're sent to designated labs, **where test reports are prepared**. Currently, the report creation process is manual and time consuming, prone to calculation errors, lacking uniformity. 

Hence, there is a requirement for a software application that automates test data recording, compliance evaluation and generation of standardized test reports as per OIML R 76, to improve *accuracy, consistency and efficiency* in the model approval process.

## Software Requirements

- Should be able to capture instrument details and technical specifications.
- Recording laboratory and environmental conditions.
- Search and Retrieval facility
- Automatic preparation of standardized test reports with auto-population of laboratory and instrument details
- Digital signatures (optional)
- ✅ Entering observations from various OIML R-76 compliant test procedures.
- ✅ Automatically determining pass/fail criteria.
- ✅ Generate standardized digital test reports which can be printed.
- ✅ Maintain a digital repository of completed test reports.
- ✅ Providing secure user access with role-based permissions.
- ✅ Supports easy future updating whenever OIML recommendations are revised.
- ✅ Should be a user-friendly desktop/web-based application.
- ✅ Digital data entry forms for applicable OIML R-76 tests
- ✅ Test Report generation in PDF and editable formats MS WORD etc.
- ✅ Instrument-bound test history and report repository.
- ✅ Real-Time Dashboard for monitoring real-time testing activities.
	- ✅ Automatically calculating permissible errors, and compliance status (whether it complies or not)
	- ✅ Dashboard for test report management (completed, in process, history access etc.)
- ✅ Technical documentation describing software architecture (software design), calculation methodology and deployment framework (tech stack).
- ✅ Entry of manufacturer details, Instrument specifications, Model information and technical parameters
- ✅ Entry of observations for all prescribed tests
- ✅ Automatic validation of input data and related calculations
- ✅ Export to PDF and editable formats

# OIML R-76, NAWI, Instrument Classification

Task: Generating Test Reports of NAWI as per [OIML Recommendation](https://www.oiml.org/en/files/pdf_r/r076-1-e06.pdf)
	OIML - International Organization of Legal Metrology (French), their aim is to harmonize the regulations and metrological controls.

**International Recommendations (OIML R)**, which are model regulations that establish the metrological characteristics required of certain measuring instruments and which specify methods and equipment for checking their conformity. OIML Member States shall implement these Recommendations to the greatest possible extent.

OIML's definition of Non-Automatic Weighing Instruments (NAWI)
*Instrument that requires the intervention of an operator during the weighing process to decide that the weighing result is acceptable.*
essentially, a mentor of a weighing instrument.

NAWI can be of following types:
a) Graduated / Non-Graduated
	Graduated: Instrument allows direct reading of complete or partial weighing result.
	Non Graduated: Instrument not fitted with scale numbered in units of mass.
b) Self Indicating / Semi-Self Indicating / Non-Self Indicating
	Self Indicating: Instrument in which position of equilibrium is obtained without operator intervention.
	Semi-self-indicating: Self-indicating weighing range, operator intervenes to alter it.
	Non-self-indicating: Position of equilibrium obtained entirely by operator.

## Recommendations

### Units of Measurement
- kg, mg, g, tonne (t)
- special applications: 1 carat (ct.) = 0.2g


### Accuracy Classes

| Name              | Symbol | Denomination |
| ----------------- | ------ | ------------ |
| Special Accuracy  | I      | I            |
| High Accuracy     | II     | II           |
| Medium Accuracy   | III    | III          |
| Ordinary Accuracy | IIII   | IIII         |

# Vexoria's Software — WeighLabs

As per the requirements provided by the problem statement, the following techstack is selected:

 - **Electron (React + Tailwind)** — used for UI/UX of the software, data entering by the operator, report viewing/formatting/printing, handling instrument profile, operator profile, etc.
 - **Native executable built with Rust** — used for high-speed gRPC/websocket communication with Electron frontend and communication with lab machinery, a seperate decentralized executable that runs alongside Electron for uninterruptable testing.

During testing
- Operator logs into the software using their login credentials.
	- They enter instrument details
		- Pattern/model
		- instrument type
		- instrument description
		- instrument characteristics
		- manufacturer
		- country
		- submitted by
		- year of manufacture
	- They enter details regarding themselves, the lab and approver.
		- Test start date
		- Test completion date
		- Operator information (gets prefilled based on credentials)
		- Report date (filled when report is completed)
		- Laboratory Name and Ref No (filled based on credentials)
	- They enter details regarding standards applied, accreditation, and establish confirmation that the test they'll conduct are purely unbiased.
	- They then callibrate the testing equipment, and each test conducted on the instrument is referenced to the testing equipment
	- Testing begins
		- Software is ready and waits for operator to put load onto the instrument
		- Once the load is loaded on top of the instrument, the native go executable catches the stream of information provided by the instrument, logs it and sends it to the electron app for real-time dashboard display.
		- The software waits for a while, catches the reading and once the reading is stable, it reads the value, logs it, immediately starts a new test and prompts the operator to add more load.
		- the process continues until a satisfactory number of tests have been performed and the operator is satisfied with the number of tests conducted.
	- Once all testings have been conducted, the software creates a report and shows it to the operator, who views it and if the reports are satisfactory, proceeds with printing. The software takes credentials provided at the beginning of the test, applies them to the test and creates a printable preview. The software also logs the testing to the instrument, the operator, the company and the model for future needs.