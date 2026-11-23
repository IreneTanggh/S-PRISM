
export const test = [
    {label: "CIA_1", content: "Report Date: 1 Aaril. 2003. CIA [From M15]:----- On 30 March, 2003 the British Special Branch arrested Omar Bakri Qatada at his home at #11 St. Mary's Terrace, addington, London. Found in Qatada's bedroom was a small carton holding 10 ounces of Pentaerythritol [PETN] and Triacetone Triperoxide [TATP]. This is the same explosive that Richard Reid attempted to use on American Airlines #63 from Paris to Miami on 22 December, 2001. The BSB were alerted to follow and detain Qatada on the basis of information obtained from a respected moderate Moslem cleric in London, whose name was not provided in this report from M15."},
    {label: "CIA_2", content: "Report Date: 9 April, 2003. CIA -----[From a detainee at Guantanamo, Cuba who has given the name Abdul al Hada]:----- During an interview with CIA officers in March of 2003, al Hada is reported to have said:\"In April 2003 there is not such good weather for flying\". Asked what he meant by this statement, the detainee said: \"That's for you to figure out\". The detainee would not elaborate further."},
    {label: "CIA_3", content: "Report Date 12 April. 2003. CIA From French Intelligence:----- Acting on a tip from an unnamed source,French police arrested an Egyptian named Muhammad Shamzai at his home at 16 Rue St. Sebastien in Paris on 8 April, 2002. In his home police found 200 US and 180 British blank passports. In addition, on the hard drive of Shamzi's laptop computer was a record of a US and British passports that Shamzi had apparently forged. One of these passports was made out in the name Masood Yaser, whose address was listed as 1660 Coal Mine Road, Apartment 206, Denver, Colorado, USA. Another US passport forged was in the name Vincent Lozario, 2229 Marshall Avenue. Minneapolis, Minnesota, USA. A third forged US passport was in the name Khalfan Maulid, 656 Laurel Avenue, Bowling Green, Kentucky, USA."},
    {label: "CIA_4", content: "Report Date 14 April, 2003. CIA:----- From an interrogation of a cooperative detainee in Guantanamo.Detainee says he trained daily with a man named Ziad al Shibh at an Al Qaeda explosives training facility in the Sudan in 1994. From a captured laptop computer in Afghanistan it is learned that Ziad al Shibh holds a United Arab Emirates passport in the name Faysal Goba. INS check reveals that a Faysal Goba, from the United Arab Emirates, entered the USA on a travel visa in January of 2003 stating that he would be visiting a person named Clark Webster in Richmond, Va. The contact address given by Goba was: 1631 Capitol Ave., Richmond VA; phone number: 804-759-6302."},
    {label: "CIA_5", content: "Report Date 20 April. 2003. CIA:----- On 19 April, a car bomb was set off near the American Diplomatic Mission Headquarters in Buenos Aires. There were no casualties since the bomb seems to have gone off prematurely. The driver of the car carrying the bomb Survived. He has been identified as Jamil Musawi,who is known to be a member of Hezboliah. This organization has had a presence in several Latin American countries."}
]

// const type = 'xx_html';
// const x = 100;
// const y = 100;
const highlight = [];
const testShapes = {}

function addAttributesToJson(jsonData) {
    // console.log('jsonData', jsonData)
    const result = []
    // Loop through each item in the jsonData array
    jsonData.forEach(item => {
        // Add each new attribute and its value to the item
        result.push({
            type: 'xx_html',
            x: 100,
            y: 100,
            props: {
                label: item['label'],
                content: item['content']
            }
        })
    });

    return result;
}

const testShape = addAttributesToJson(test);

export default testShape;