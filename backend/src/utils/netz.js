
const netz =
[
{"id":"1","nachbar1":"21","nachbar2":"2","nachbar3":null,"ort1":"1","ort2":"12","ort3":"13"},
{"id":"2","nachbar1":"1","nachbar2":"3","nachbar3":null,"ort1":"1","ort2":"2","ort3":"13"},
{"id":"3","nachbar1":"2","nachbar2":"23","nachbar3":"4","ort1":"2","ort2":"13","ort3":"14"},
{"id":"4","nachbar1":"3","nachbar2":"5","nachbar3":null,"ort1":"2","ort2":"3","ort3":"14"},
{"id":"5","nachbar1":"4","nachbar2":"6","nachbar3":"25","ort1":"3","ort2":"14","ort3":"15"},
{"id":"6","nachbar1":"5","nachbar2":"7","nachbar3":null,"ort1":"3","ort2":"4","ort3":"15"},
{"id":"7","nachbar1":"27","nachbar2":"6","nachbar3":"8","ort1":"4","ort2":"15","ort3":"16"},
{"id":"8","nachbar1":"7","nachbar2":"9","nachbar3":null,"ort1":"4","ort2":"5","ort3":"16"},
{"id":"9","nachbar1":"8","nachbar2":"10","nachbar3":"29","ort1":"5","ort2":"16","ort3":"17"},
{"id":"10","nachbar1":"9","nachbar2":"11","nachbar3":null,"ort1":"5","ort2":"6","ort3":"17"},
{"id":"11","nachbar1":"10","nachbar2":"12","nachbar3":"31","ort1":"6","ort2":"17","ort3":"18"},
{"id":"12","nachbar1":"11","nachbar2":"13","nachbar3":null,"ort1":"6","ort2":"7","ort3":"18"},
{"id":"13","nachbar1":"12","nachbar2":"14","nachbar3":"33","ort1":"7","ort2":"18","ort3":"19"},
{"id":"14","nachbar1":"13","nachbar2":"15","nachbar3":null,"ort1":"7","ort2":"8","ort3":"19"},
{"id":"15","nachbar1":"14","nachbar2":"16","nachbar3":"35","ort1":"8","ort2":"19","ort3":"20"},
{"id":"16","nachbar1":"15","nachbar2":"17","nachbar3":null,"ort1":"8","ort2":"9","ort3":"20"},
{"id":"17","nachbar1":"16","nachbar2":"18","nachbar3":"37","ort1":"9","ort2":"20","ort3":"21"},
{"id":"18","nachbar1":"17","nachbar2":"19","nachbar3":null,"ort1":"9","ort2":"10","ort3":"21"},
{"id":"19","nachbar1":"20","nachbar2":"18","nachbar3":"39","ort1":"10","ort2":"21","ort3":"22"},
{"id":"20","nachbar1":"19","nachbar2":null,"nachbar3":null,"ort1":"10","ort2":"11","ort3":"22"},
{"id":"21","nachbar1":"1","nachbar2":"22","nachbar3":null,"ort1":"11","ort2":"12","ort3":"23"},
{"id":"22","nachbar1":"42","nachbar2":"23","nachbar3":"21","ort1":"12","ort2":"23","ort3":"24"},
{"id":"23","nachbar1":"3","nachbar2":"24","nachbar3":"22","ort1":"14","ort2":"13","ort3":"24"},
{"id":"24","nachbar1":"44","nachbar2":"25","nachbar3":"23","ort1":"14","ort2":"24","ort3":"25"},
{"id":"25","nachbar1":"5","nachbar2":"26","nachbar3":"24","ort1":"14","ort2":"13","ort3":"25"},
{"id":"26","nachbar1":"46","nachbar2":"27","nachbar3":"25","ort1":"14","ort2":"25","ort3":"26"},
{"id":"27","nachbar1":"7","nachbar2":"28","nachbar3":"26","ort1":"15","ort2":"14","ort3":"26"},
{"id":"28","nachbar1":"48","nachbar2":"29","nachbar3":"27","ort1":"15","ort2":"26","ort3":"27"},
{"id":"29","nachbar1":"9","nachbar2":"30","nachbar3":"28","ort1":"16","ort2":"15","ort3":"27"},
{"id":"30","nachbar1":"50","nachbar2":"31","nachbar3":"29","ort1":"16","ort2":"27","ort3":"28"},
{"id":"31","nachbar1":"11","nachbar2":"32","nachbar3":"30","ort1":"17","ort2":"16","ort3":"28"},
{"id":"32","nachbar1":"52","nachbar2":"33","nachbar3":"31","ort1":"17","ort2":"28","ort3":"29"},
{"id":"33","nachbar1":"13","nachbar2":"34","nachbar3":"32","ort1":"18","ort2":"17","ort3":"29"},
{"id":"34","nachbar1":"54","nachbar2":"35","nachbar3":"33","ort1":"18","ort2":"29","ort3":"30"},
{"id":"35","nachbar1":"15","nachbar2":"36","nachbar3":"34","ort1":"19","ort2":"18","ort3":"30"},
{"id":"36","nachbar1":"56","nachbar2":"37","nachbar3":"35","ort1":"19","ort2":"30","ort3":"31"},
{"id":"37","nachbar1":"17","nachbar2":"38","nachbar3":"36","ort1":"20","ort2":"19","ort3":"30"},
{"id":"38","nachbar1":"58","nachbar2":"39","nachbar3":"37","ort1":"20","ort2":"30","ort3":"31"},
{"id":"39","nachbar1":"19","nachbar2":"40","nachbar3":"38","ort1":"21","ort2":"20","ort3":"31"},
{"id":"40","nachbar1":"60","nachbar2":null,"nachbar3":"39","ort1":"21","ort2":"20","ort3":"31"},
{"id":"41","nachbar1":null,"nachbar2":"42","nachbar3":"61","ort1":"23","ort2":"34","ort3":"35"},
{"id":"42","nachbar1":"22","nachbar2":"43","nachbar3":"41","ort1":"23","ort2":"24","ort3":"35"},
{"id":"43","nachbar1":"63","nachbar2":"44","nachbar3":"42","ort1":"24","ort2":"35","ort3":"36"},
{"id":"44","nachbar1":"24","nachbar2":"45","nachbar3":"43","ort1":"24","ort2":"25","ort3":"36"},
{"id":"45","nachbar1":"65","nachbar2":"46","nachbar3":"44","ort1":"25","ort2":"36","ort3":"37"},
{"id":"46","nachbar1":"26","nachbar2":"47","nachbar3":"45","ort1":"25","ort2":"26","ort3":"37"},
{"id":"47","nachbar1":"67","nachbar2":"48","nachbar3":"46","ort1":"26","ort2":"37","ort3":"38"},
{"id":"48","nachbar1":"28","nachbar2":"49","nachbar3":"47","ort1":"26","ort2":"27","ort3":"38"},
{"id":"49","nachbar1":"69","nachbar2":"50","nachbar3":"48","ort1":"27","ort2":"38","ort3":"39"},
{"id":"50","nachbar1":"30","nachbar2":"51","nachbar3":"49","ort1":"27","ort2":"28","ort3":"39"},
{"id":"51","nachbar1":"71","nachbar2":"52","nachbar3":"50","ort1":"28","ort2":"39","ort3":"40"},
{"id":"52","nachbar1":"32","nachbar2":"53","nachbar3":"51","ort1":"28","ort2":"29","ort3":"40"},
{"id":"53","nachbar1":"73","nachbar2":"54","nachbar3":"52","ort1":"29","ort2":"40","ort3":"41"},
{"id":"54","nachbar1":"34","nachbar2":"55","nachbar3":"53","ort1":"29","ort2":"30","ort3":"41"},
{"id":"55","nachbar1":"75","nachbar2":"56","nachbar3":"54","ort1":"30","ort2":"41","ort3":"42"},
{"id":"56","nachbar1":"36","nachbar2":"57","nachbar3":"55","ort1":"30","ort2":"31","ort3":"42"},
{"id":"57","nachbar1":"77","nachbar2":"58","nachbar3":"56","ort1":"31","ort2":"42","ort3":"43"},
{"id":"58","nachbar1":"38","nachbar2":"59","nachbar3":"57","ort1":"31","ort2":"32","ort3":"43"},
{"id":"59","nachbar1":"79","nachbar2":"60","nachbar3":"58","ort1":"32","ort2":"43","ort3":"44"},
{"id":"60","nachbar1":"40","nachbar2":null,"nachbar3":"59","ort1":"32","ort2":"33","ort3":"44"},
{"id":"61","nachbar1":"41","nachbar2":"62","nachbar3":null,"ort1":"33","ort2":"34","ort3":"45"},
{"id":"62","nachbar1":"82","nachbar2":"63","nachbar3":"61","ort1":"34","ort2":"45","ort3":"46"},
{"id":"63","nachbar1":"43","nachbar2":"64","nachbar3":"62","ort1":"36","ort2":"35","ort3":"46"},
{"id":"64","nachbar1":"84","nachbar2":"65","nachbar3":"63","ort1":"36","ort2":"46","ort3":"47"},
{"id":"65","nachbar1":"45","nachbar2":"66","nachbar3":"64","ort1":"36","ort2":"35","ort3":"47"},
{"id":"66","nachbar1":"86","nachbar2":"67","nachbar3":"65","ort1":"36","ort2":"47","ort3":"48"},
{"id":"67","nachbar1":"47","nachbar2":"68","nachbar3":"66","ort1":"37","ort2":"36","ort3":"48"},
{"id":"68","nachbar1":"88","nachbar2":"69","nachbar3":"67","ort1":"37","ort2":"48","ort3":"49"},
{"id":"69","nachbar1":"49","nachbar2":"70","nachbar3":"68","ort1":"38","ort2":"37","ort3":"49"},
{"id":"70","nachbar1":"90","nachbar2":"71","nachbar3":"69","ort1":"38","ort2":"49","ort3":"50"},
{"id":"71","nachbar1":"51","nachbar2":"72","nachbar3":"70","ort1":"39","ort2":"38","ort3":"50"},
{"id":"72","nachbar1":"92","nachbar2":"73","nachbar3":"71","ort1":"39","ort2":"50","ort3":"51"},
{"id":"73","nachbar1":"53","nachbar2":"74","nachbar3":"72","ort1":"40","ort2":"39","ort3":"51"},
{"id":"74","nachbar1":"94","nachbar2":"75","nachbar3":"73","ort1":"40","ort2":"51","ort3":"52"},
{"id":"75","nachbar1":"55","nachbar2":"76","nachbar3":"74","ort1":"41","ort2":"40","ort3":"52"},
{"id":"76","nachbar1":"96","nachbar2":"77","nachbar3":"75","ort1":"41","ort2":"52","ort3":"53"},
{"id":"77","nachbar1":"57","nachbar2":"78","nachbar3":"76","ort1":"42","ort2":"41","ort3":"52"},
{"id":"78","nachbar1":"98","nachbar2":"79","nachbar3":"77","ort1":"42","ort2":"52","ort3":"53"},
{"id":"79","nachbar1":"59","nachbar2":"80","nachbar3":"78","ort1":"43","ort2":"42","ort3":"53"},
{"id":"80","nachbar1":"100","nachbar2":null,"nachbar3":"79","ort1":"43","ort2":"42","ort3":"53"},
{"id":"81","nachbar1":"101","nachbar2":"82","nachbar3":null,"ort1":"45","ort2":"56","ort3":"57"},
{"id":"82","nachbar1":"62","nachbar2":"83","nachbar3":"81","ort1":"45","ort2":"46","ort3":"57"},
{"id":"83","nachbar1":"103","nachbar2":"84","nachbar3":"82","ort1":"46","ort2":"57","ort3":"58"},
{"id":"84","nachbar1":"64","nachbar2":"85","nachbar3":"83","ort1":"46","ort2":"47","ort3":"58"},
{"id":"85","nachbar1":"105","nachbar2":"86","nachbar3":"84","ort1":"47","ort2":"58","ort3":"59"},
{"id":"86","nachbar1":"66","nachbar2":"87","nachbar3":"85","ort1":"47","ort2":"48","ort3":"59"},
{"id":"87","nachbar1":"107","nachbar2":"88","nachbar3":"86","ort1":"48","ort2":"59","ort3":"60"},
{"id":"88","nachbar1":"68","nachbar2":"89","nachbar3":"87","ort1":"48","ort2":"49","ort3":"60"},
{"id":"89","nachbar1":"109","nachbar2":"90","nachbar3":"88","ort1":"49","ort2":"60","ort3":"61"},
{"id":"90","nachbar1":"70","nachbar2":"91","nachbar3":"89","ort1":"49","ort2":"50","ort3":"61"},
{"id":"91","nachbar1":"111","nachbar2":"92","nachbar3":"90","ort1":"50","ort2":"61","ort3":"62"},
{"id":"92","nachbar1":"72","nachbar2":"93","nachbar3":"91","ort1":"50","ort2":"51","ort3":"62"},
{"id":"93","nachbar1":"113","nachbar2":"94","nachbar3":"92","ort1":"51","ort2":"62","ort3":"63"},
{"id":"94","nachbar1":"74","nachbar2":"95","nachbar3":"93","ort1":"51","ort2":"52","ort3":"63"},
{"id":"95","nachbar1":"115","nachbar2":"96","nachbar3":"94","ort1":"52","ort2":"63","ort3":"64"},
{"id":"96","nachbar1":"76","nachbar2":"97","nachbar3":"95","ort1":"52","ort2":"53","ort3":"64"},
{"id":"97","nachbar1":"117","nachbar2":"98","nachbar3":"96","ort1":"53","ort2":"64","ort3":"65"},
{"id":"98","nachbar1":"78","nachbar2":"99","nachbar3":"97","ort1":"53","ort2":"54","ort3":"65"},
{"id":"99","nachbar1":"119","nachbar2":"100","nachbar3":"98","ort1":"54","ort2":"65","ort3":"66"},
{"id":"100","nachbar1":null,"nachbar2":"80","nachbar3":"99","ort1":"54","ort2":"55","ort3":"66"},
{"id":"101","nachbar1":"81","nachbar2":"102","nachbar3":null,"ort1":"55","ort2":"56","ort3":"67"},
{"id":"102","nachbar1":"122","nachbar2":"103","nachbar3":"101","ort1":"56","ort2":"67","ort3":"68"},
{"id":"103","nachbar1":"83","nachbar2":"104","nachbar3":"102","ort1":"58","ort2":"57","ort3":"68"},
{"id":"104","nachbar1":"124","nachbar2":"105","nachbar3":"103","ort1":"58","ort2":"68","ort3":"69"},
{"id":"105","nachbar1":"85","nachbar2":"106","nachbar3":"104","ort1":"58","ort2":"57","ort3":"69"},
{"id":"106","nachbar1":"126","nachbar2":"107","nachbar3":"105","ort1":"58","ort2":"69","ort3":"70"},
{"id":"107","nachbar1":"87","nachbar2":"108","nachbar3":"106","ort1":"59","ort2":"58","ort3":"70"},
{"id":"108","nachbar1":"128","nachbar2":"109","nachbar3":"107","ort1":"59","ort2":"70","ort3":"71"},
{"id":"109","nachbar1":"89","nachbar2":"110","nachbar3":"108","ort1":"60","ort2":"59","ort3":"71"},
{"id":"110","nachbar1":"130","nachbar2":"111","nachbar3":"109","ort1":"60","ort2":"71","ort3":"72"},
{"id":"111","nachbar1":"91","nachbar2":"112","nachbar3":"110","ort1":"61","ort2":"60","ort3":"72"},
{"id":"112","nachbar1":"132","nachbar2":"113","nachbar3":"111","ort1":"61","ort2":"72","ort3":"73"},
{"id":"113","nachbar1":"93","nachbar2":"114","nachbar3":"112","ort1":"62","ort2":"61","ort3":"73"},
{"id":"114","nachbar1":"134","nachbar2":"115","nachbar3":"113","ort1":"62","ort2":"73","ort3":"74"},
{"id":"115","nachbar1":"95","nachbar2":"116","nachbar3":"114","ort1":"63","ort2":"62","ort3":"74"},
{"id":"116","nachbar1":"136","nachbar2":"117","nachbar3":"115","ort1":"63","ort2":"74","ort3":"75"},
{"id":"117","nachbar1":"97","nachbar2":"118","nachbar3":"116","ort1":"64","ort2":"63","ort3":"74"},
{"id":"118","nachbar1":"138","nachbar2":"119","nachbar3":"117","ort1":"64","ort2":"74","ort3":"75"},
{"id":"119","nachbar1":"99","nachbar2":"120","nachbar3":"118","ort1":"65","ort2":"64","ort3":"75"},
{"id":"120","nachbar1":"140","nachbar2":null,"nachbar3":"119","ort1":"65","ort2":"64","ort3":"75"},
{"id":"121","nachbar1":"141","nachbar2":"122","nachbar3":null,"ort1":"67","ort2":"78","ort3":"79"},
{"id":"122","nachbar1":"142","nachbar2":"123","nachbar3":"121","ort1":"67","ort2":"68","ort3":"79"},
{"id":"123","nachbar1":"103","nachbar2":"124","nachbar3":"122","ort1":"68","ort2":"79","ort3":"80"},
{"id":"124","nachbar1":"144","nachbar2":"125","nachbar3":"123","ort1":"68","ort2":"69","ort3":"80"},
{"id":"125","nachbar1":"105","nachbar2":"126","nachbar3":"124","ort1":"69","ort2":"80","ort3":"81"},
{"id":"126","nachbar1":"146","nachbar2":"127","nachbar3":"125","ort1":"69","ort2":"70","ort3":"81"},
{"id":"127","nachbar1":"107","nachbar2":"128","nachbar3":"126","ort1":"70","ort2":"81","ort3":"82"},
{"id":"128","nachbar1":"148","nachbar2":"129","nachbar3":"127","ort1":"70","ort2":"71","ort3":"82"},
{"id":"129","nachbar1":"109","nachbar2":"130","nachbar3":"128","ort1":"71","ort2":"82","ort3":"83"},
{"id":"130","nachbar1":"150","nachbar2":"131","nachbar3":"129","ort1":"71","ort2":"72","ort3":"83"},
{"id":"131","nachbar1":"111","nachbar2":"132","nachbar3":"130","ort1":"72","ort2":"83","ort3":"84"},
{"id":"132","nachbar1":"152","nachbar2":"133","nachbar3":"131","ort1":"72","ort2":"73","ort3":"84"},
{"id":"133","nachbar1":"113","nachbar2":"134","nachbar3":"132","ort1":"73","ort2":"84","ort3":"85"},
{"id":"134","nachbar1":"154","nachbar2":"135","nachbar3":"133","ort1":"73","ort2":"74","ort3":"85"},
{"id":"135","nachbar1":"115","nachbar2":"136","nachbar3":"134","ort1":"74","ort2":"85","ort3":"86"},
{"id":"136","nachbar1":"156","nachbar2":"137","nachbar3":"135","ort1":"74","ort2":"75","ort3":"86"},
{"id":"137","nachbar1":"117","nachbar2":"138","nachbar3":"136","ort1":"75","ort2":"86","ort3":"87"},
{"id":"138","nachbar1":"158","nachbar2":"139","nachbar3":"137","ort1":"75","ort2":"76","ort3":"87"},
{"id":"139","nachbar1":"119","nachbar2":"140","nachbar3":"138","ort1":"76","ort2":"87","ort3":"88"},
{"id":"140","nachbar1":"160","nachbar2":"141","nachbar3":"139","ort1":"76","ort2":"77","ort3":"88"},
{"id":"141","nachbar1":"121","nachbar2":"142","nachbar3":null,"ort1":"77","ort2":"78","ort3":"89"},
{"id":"142","nachbar1":"162","nachbar2":"143","nachbar3":"141","ort1":"78","ort2":"89","ort3":"90"},
{"id":"143","nachbar1":"123","nachbar2":"144","nachbar3":"142","ort1":"80","ort2":"79","ort3":"90"},
{"id":"144","nachbar1":"164","nachbar2":"145","nachbar3":"143","ort1":"80","ort2":"90","ort3":"91"},
{"id":"145","nachbar1":"125","nachbar2":"146","nachbar3":"144","ort1":"80","ort2":"79","ort3":"91"},
{"id":"146","nachbar1":"166","nachbar2":"147","nachbar3":"145","ort1":"80","ort2":"91","ort3":"92"},
{"id":"147","nachbar1":"127","nachbar2":"148","nachbar3":"146","ort1":"81","ort2":"80","ort3":"92"},
{"id":"148","nachbar1":"168","nachbar2":"149","nachbar3":"147","ort1":"81","ort2":"92","ort3":"93"},
{"id":"149","nachbar1":"129","nachbar2":"150","nachbar3":"148","ort1":"82","ort2":"81","ort3":"93"},
{"id":"150","nachbar1":"170","nachbar2":"151","nachbar3":"149","ort1":"82","ort2":"93","ort3":"94"},
{"id":"151","nachbar1":"131","nachbar2":"152","nachbar3":"150","ort1":"83","ort2":"82","ort3":"94"},
{"id":"152","nachbar1":"172","nachbar2":"153","nachbar3":"151","ort1":"83","ort2":"94","ort3":"95"},
{"id":"153","nachbar1":"133","nachbar2":"154","nachbar3":"152","ort1":"84","ort2":"83","ort3":"95"},
{"id":"154","nachbar1":"174","nachbar2":"155","nachbar3":"153","ort1":"84","ort2":"95","ort3":"96"},
{"id":"155","nachbar1":"135","nachbar2":"156","nachbar3":"154","ort1":"85","ort2":"84","ort3":"96"},
{"id":"156","nachbar1":"176","nachbar2":"157","nachbar3":"155","ort1":"85","ort2":"96","ort3":"97"},
{"id":"157","nachbar1":"137","nachbar2":"158","nachbar3":"156","ort1":"86","ort2":"85","ort3":"96"},
{"id":"158","nachbar1":"178","nachbar2":"159","nachbar3":"157","ort1":"86","ort2":"96","ort3":"97"},
{"id":"159","nachbar1":"139","nachbar2":"160","nachbar3":"158","ort1":"87","ort2":"86","ort3":"97"},
{"id":"160","nachbar1":"180","nachbar2":null,"nachbar3":"159","ort1":"87","ort2":"86","ort3":"97"},
{"id":"161","nachbar1":null,"nachbar2":"162","nachbar3":"181","ort1":"89","ort2":"100","ort3":"101"},
{"id":"162","nachbar1":"142","nachbar2":"163","nachbar3":"161","ort1":"89","ort2":"90","ort3":"101"},
{"id":"163","nachbar1":"183","nachbar2":"164","nachbar3":"162","ort1":"90","ort2":"101","ort3":"102"},
{"id":"164","nachbar1":"144","nachbar2":"165","nachbar3":"163","ort1":"90","ort2":"91","ort3":"102"},
{"id":"165","nachbar1":"185","nachbar2":"166","nachbar3":"164","ort1":"91","ort2":"102","ort3":"103"},
{"id":"166","nachbar1":"146","nachbar2":"167","nachbar3":"165","ort1":"91","ort2":"92","ort3":"103"},
{"id":"167","nachbar1":"187","nachbar2":"168","nachbar3":"166","ort1":"92","ort2":"103","ort3":"104"},
{"id":"168","nachbar1":"148","nachbar2":"169","nachbar3":"167","ort1":"92","ort2":"93","ort3":"104"},
{"id":"169","nachbar1":"189","nachbar2":"170","nachbar3":"168","ort1":"93","ort2":"104","ort3":"105"},
{"id":"170","nachbar1":"150","nachbar2":"171","nachbar3":"169","ort1":"93","ort2":"94","ort3":"105"},
{"id":"171","nachbar1":"191","nachbar2":"172","nachbar3":"170","ort1":"94","ort2":"105","ort3":"106"},
{"id":"172","nachbar1":"152","nachbar2":"173","nachbar3":"171","ort1":"94","ort2":"95","ort3":"106"},
{"id":"173","nachbar1":"193","nachbar2":"174","nachbar3":"172","ort1":"95","ort2":"106","ort3":"107"},
{"id":"174","nachbar1":"154","nachbar2":"175","nachbar3":"173","ort1":"95","ort2":"96","ort3":"107"},
{"id":"175","nachbar1":"195","nachbar2":"176","nachbar3":"174","ort1":"96","ort2":"107","ort3":"108"},
{"id":"176","nachbar1":"156","nachbar2":"177","nachbar3":"175","ort1":"96","ort2":"97","ort3":"108"},
{"id":"177","nachbar1":"197","nachbar2":"178","nachbar3":"176","ort1":"97","ort2":"108","ort3":"109"},
{"id":"178","nachbar1":"158","nachbar2":"179","nachbar3":"177","ort1":"97","ort2":"98","ort3":"109"},
{"id":"179","nachbar1":"199","nachbar2":"180","nachbar3":"178","ort1":"98","ort2":"109","ort3":"110"},
{"id":"180","nachbar1":"160","nachbar2":null,"nachbar3":"179","ort1":"98","ort2":"99","ort3":"110"},
{"id":"181","nachbar1":"161","nachbar2":"182","nachbar3":null,"ort1":"99","ort2":"100","ort3":"111"},
{"id":"182","nachbar1":"202","nachbar2":"183","nachbar3":"181","ort1":"100","ort2":"111","ort3":"112"},
{"id":"183","nachbar1":"163","nachbar2":"184","nachbar3":"182","ort1":"102","ort2":"101","ort3":"112"},
{"id":"184","nachbar1":"204","nachbar2":"185","nachbar3":"183","ort1":"102","ort2":"112","ort3":"113"},
{"id":"185","nachbar1":"165","nachbar2":"186","nachbar3":"184","ort1":"102","ort2":"101","ort3":"113"},
{"id":"186","nachbar1":"206","nachbar2":"187","nachbar3":"185","ort1":"102","ort2":"113","ort3":"114"},
{"id":"187","nachbar1":"167","nachbar2":"188","nachbar3":"186","ort1":"103","ort2":"102","ort3":"114"},
{"id":"188","nachbar1":"208","nachbar2":"189","nachbar3":"187","ort1":"103","ort2":"114","ort3":"115"},
{"id":"189","nachbar1":"169","nachbar2":"190","nachbar3":"188","ort1":"104","ort2":"103","ort3":"115"},
{"id":"190","nachbar1":"210","nachbar2":"191","nachbar3":"189","ort1":"104","ort2":"115","ort3":"116"},
{"id":"191","nachbar1":"171","nachbar2":"192","nachbar3":"190","ort1":"105","ort2":"104","ort3":"116"},
{"id":"192","nachbar1":"212","nachbar2":"193","nachbar3":"191","ort1":"105","ort2":"116","ort3":"117"},
{"id":"193","nachbar1":"173","nachbar2":"194","nachbar3":"192","ort1":"106","ort2":"105","ort3":"117"},
{"id":"194","nachbar1":"214","nachbar2":"195","nachbar3":"193","ort1":"106","ort2":"117","ort3":"118"},
{"id":"195","nachbar1":"175","nachbar2":"196","nachbar3":"194","ort1":"107","ort2":"106","ort3":"118"},
{"id":"196","nachbar1":"216","nachbar2":"197","nachbar3":"195","ort1":"107","ort2":"118","ort3":"119"},
{"id":"197","nachbar1":"177","nachbar2":"198","nachbar3":"196","ort1":"108","ort2":"107","ort3":"118"},
{"id":"198","nachbar1":"218","nachbar2":"199","nachbar3":"197","ort1":"108","ort2":"118","ort3":"119"},
{"id":"199","nachbar1":"179","nachbar2":"200","nachbar3":"198","ort1":"109","ort2":"108","ort3":"119"},
{"id":"200","nachbar1":"220","nachbar2":null,"nachbar3":"199","ort1":"109","ort2":"108","ort3":"119"},
{"id":"201","nachbar1":"221","nachbar2":"202","nachbar3":null,"ort1":"111","ort2":"122","ort3":"123"},
{"id":"202","nachbar1":"182","nachbar2":"203","nachbar3":"201","ort1":"111","ort2":"112","ort3":"123"},
{"id":"203","nachbar1":"223","nachbar2":"204","nachbar3":"202","ort1":"112","ort2":"123","ort3":"124"},
{"id":"204","nachbar1":"184","nachbar2":"205","nachbar3":"203","ort1":"112","ort2":"113","ort3":"124"},
{"id":"205","nachbar1":"225","nachbar2":"206","nachbar3":"204","ort1":"113","ort2":"124","ort3":"125"},
{"id":"206","nachbar1":"186","nachbar2":"207","nachbar3":"205","ort1":"113","ort2":"114","ort3":"125"},
{"id":"207","nachbar1":"227","nachbar2":"208","nachbar3":"206","ort1":"114","ort2":"125","ort3":"126"},
{"id":"208","nachbar1":"188","nachbar2":"209","nachbar3":"207","ort1":"114","ort2":"115","ort3":"126"},
{"id":"209","nachbar1":"229","nachbar2":"210","nachbar3":"208","ort1":"115","ort2":"126","ort3":"127"},
{"id":"210","nachbar1":"190","nachbar2":"211","nachbar3":"209","ort1":"115","ort2":"116","ort3":"127"},
{"id":"211","nachbar1":"231","nachbar2":"212","nachbar3":"210","ort1":"116","ort2":"127","ort3":"128"},
{"id":"212","nachbar1":"192","nachbar2":"213","nachbar3":"211","ort1":"116","ort2":"117","ort3":"128"},
{"id":"213","nachbar1":"233","nachbar2":"214","nachbar3":"212","ort1":"117","ort2":"128","ort3":"129"},
{"id":"214","nachbar1":"194","nachbar2":"215","nachbar3":"213","ort1":"117","ort2":"118","ort3":"129"},
{"id":"215","nachbar1":"235","nachbar2":"216","nachbar3":"214","ort1":"118","ort2":"129","ort3":"130"},
{"id":"216","nachbar1":"196","nachbar2":"217","nachbar3":"215","ort1":"118","ort2":"119","ort3":"130"},
{"id":"217","nachbar1":"237","nachbar2":"218","nachbar3":"216","ort1":"119","ort2":"130","ort3":"131"},
{"id":"218","nachbar1":"198","nachbar2":"219","nachbar3":"217","ort1":"119","ort2":"120","ort3":"131"},
{"id":"219","nachbar1":"239","nachbar2":"220","nachbar3":"218","ort1":"120","ort2":"131","ort3":"132"},
{"id":"220","nachbar1":null,"nachbar2":"200","nachbar3":"219","ort1":"120","ort2":"121","ort3":"132"},
{"id":"221","nachbar1":"201","nachbar2":null,"nachbar3":"222","ort1":"121","ort2":"122","ort3":"133"},
{"id":"222","nachbar1":null,"nachbar2":"223","nachbar3":"221","ort1":"122","ort2":"133","ort3":"134"},
{"id":"223","nachbar1":"203","nachbar2":"224","nachbar3":"222","ort1":"124","ort2":"123","ort3":"134"},
{"id":"224","nachbar1":null,"nachbar2":"225","nachbar3":"223","ort1":"124","ort2":"134","ort3":"135"},
{"id":"225","nachbar1":"205","nachbar2":"226","nachbar3":"224","ort1":"124","ort2":"123","ort3":"135"},
{"id":"226","nachbar1":"0","nachbar2":"227","nachbar3":"225","ort1":"124","ort2":"135","ort3":"136"},
{"id":"227","nachbar1":"207","nachbar2":"228","nachbar3":"226","ort1":"125","ort2":"124","ort3":"136"},
{"id":"228","nachbar1":null,"nachbar2":"229","nachbar3":"227","ort1":"125","ort2":"136","ort3":"137"},
{"id":"229","nachbar1":"209","nachbar2":"230","nachbar3":"228","ort1":"126","ort2":"125","ort3":"137"},
{"id":"230","nachbar1":null,"nachbar2":"231","nachbar3":"229","ort1":"126","ort2":"137","ort3":"138"},
{"id":"231","nachbar1":"211","nachbar2":"232","nachbar3":"230","ort1":"127","ort2":"126","ort3":"138"},
{"id":"232","nachbar1":null,"nachbar2":"233","nachbar3":"231","ort1":"127","ort2":"138","ort3":"139"},
{"id":"233","nachbar1":"213","nachbar2":"234","nachbar3":"232","ort1":"128","ort2":"127","ort3":"139"},
{"id":"234","nachbar1":null,"nachbar2":"235","nachbar3":"233","ort1":"128","ort2":"139","ort3":"140"},
{"id":"235","nachbar1":"215","nachbar2":"236","nachbar3":"234","ort1":"129","ort2":"128","ort3":"140"},
{"id":"236","nachbar1":null,"nachbar2":"237","nachbar3":"235","ort1":"129","ort2":"140","ort3":"141"},
{"id":"237","nachbar1":"217","nachbar2":"238","nachbar3":"236","ort1":"130","ort2":"129","ort3":"140"},
{"id":"238","nachbar1":null,"nachbar2":"239","nachbar3":"237","ort1":"130","ort2":"140","ort3":"141"},
{"id":"239","nachbar1":"219","nachbar2":"240","nachbar3":"238","ort1":"131","ort2":"130","ort3":"141"},
{"id":"240","nachbar1":null,"nachbar2":null,"nachbar3":"239","ort1":"131","ort2":"130","ort3":"141"}
]

function buildingPossible(PlaceID)
{
 let nachbarn = findHood(PlaceID-1)
 nachbarn = removeNull(nachbarn)
 console.log(nachbarn)
 let nachbarnVonNachbarn = nachbarn.map(f=>findHood(f-1))
 nachbarnVonNachbarn=extract(nachbarnVonNachbarn)

 return nachbarnVonNachbarn
}

function findHood(placeId)
{
  var hood = []
   if (placeId === null){
      return null;
  }else{
  hood.push(netz[placeId].nachbar1);
  console.log("hier3")
  hood.push(netz[placeId].nachbar2);
  hood.push(netz[placeId].nachbar3);
  console.log("hood found", hood)
  return hood}
}

function removeNull(arr){

  for( var i = 0; i < arr.length; i++){ 
  if ( arr[i] === null) { 
    arr.splice(i, 1); 
  }
}
return arr
}

function extract( array, newarray ){
    if( !newarray ) newarray = [] ;
    if( array ) for( var i = 0 ; i < array.length ; ++i )
    {
        if(array[i]===null  ){} 
        else if(array[i].constructor.name === "Array"){ extract( array[i], newarray ) }
        else{
         newarray.push( array[i] )} ;
    }
    return newarray ;
}

function findPlacesAroundArea(Area)
{
  var places = []
  places = Object.keys(netz).filter(key=>(netz[key].ort1==Area||netz[key].ort2==Area||netz[key].ort3==Area))
  places = places.map(a=>parseInt(a)+1)
  console.log("found places", places)
  return places
}

module.exports = {
  netz,
  findHood,
  findPlacesAroundArea,
  buildingPossible

}