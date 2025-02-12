import { BlockScrollStrategy } from '@angular/cdk/overlay';
import { CommonModule, DatePipe } from '@angular/common';
import { Component, ElementRef, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Announcement, CourseVisibility } from '../models/Announcement';
import { Assignment } from '../models/Asssignment';
import { Course } from '../models/Course';
import {  CourseSchedule } from '../models/CourseSchedule';
import { Exam } from '../models/Exam';
import { AnnouncementService } from '../services/announcement.service';
import { AssignmentService } from '../services/assignment.service';
import { CourseService } from '../services/course.service';
import { ExamService } from '../services/exam.service';
import { UserService } from '../services/user.service';


export interface ClassSchedule {
  dayOfWeek: string;
  startTime: string;
  endTime: string;
}

@Component({
  selector: 'app-add-new-course',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './add-new-course.component.html',
  styleUrl: './add-new-course.component.css'
})
export class AddNewCourseComponent {
  @ViewChild('buttonContainer', { static: true })
  buttonContainer!: ElementRef;
  sliderStyle = {};
  activeButton: string = 'Courses';
  courses: any = [];
  announcements: any[] = [
    // existing announcements
  ];
  newAnnouncement = {
    title: '',
    content: ''
  };
  availableAssignments = [];
  selectedCourse = '';
  course: Course = {
    courseName: '',
    courseDescription: '',
    noOfAssignments: 0,
    noOfExams: 0,
    startDate: new Date,
    endDate: new Date,
    createdBy: '',
    createdByID: 0,
    capacity: 0,
    schedules: [],
    courseCode: '',
    semester: '',
    availableSlots: 0,
  };
  currentUser: any;
  schedules: CourseSchedule = {
    dayOfWeek: '',
    startTime: '',
    endTime: '',
  }
  success: boolean = false;
  message: string = '';
  isSubmit: boolean = false

  classSchedules: CourseSchedule[] = [{
    dayOfWeek: '',
    startTime: '',
    endTime: ''
  }]
  selectedFile: any;
  syllabusModules: string[] = [''];
  exam: Exam = {
    examNumber: 0,
    examName: '',
    courseId: '',
    courseCode: '',
    courseName: '',
    examDate: new Date(),
    examTime: '',
    roomNumber: '',
    syllabus: [],
      createdDate: new Date(),
      createdById: '',
      createdBy: '',
  };
  announcement: Announcement = { 
    title: '',
    description: '',
    createdBy: '',
    createdById: '',
    priorityName: '',
    priorityId: '',
    visibility: [],
    createdDate: new Date(),
    lastModifiedDate: new Date(), 
    attachmentLink: ''
  };

  priorityOptions = [
    { id: '1', name: 'High' },
    { id: '2', name: 'Medium' },
    { id: '3', name: 'Low' }
  ];
  professorCourses: any[] = [
  ];
  selectedCourses : any = [];
  selectedCoursesMap: { [key: string]: { courseId: string, courseName: string }[] } = {};

  assignment: Assignment = {
    assignmentName: '',
    assignmentNumber: '',
    courseId: '',
    courseName: '',
    dueDate: new Date(),
    file: new File([], ''),
    createdDate: new Date(), 
    createdById: '',
    createdBy: '' 
  };
  noofMilestones : number = 0;
  milestone : boolean = false;
  
  constructor(private courseService: CourseService, private datePipe: DatePipe, private examService: ExamService,private announcementService : AnnouncementService,private assignmentService : AssignmentService) {
    const currentUserString = sessionStorage.getItem('currentUser');
    if (currentUserString) {
      this.currentUser = JSON.parse(currentUserString);
      this.course.createdByID = this.currentUser.id;
      this.course.createdBy = this.currentUser.userName;
      this.announcement.createdById = this.currentUser.id;
      this.announcement.createdBy = this.currentUser.userName
    }
    this.loadAllCourses();
  }
  loadAllCourses(): void {
    this.courseService.getCoursesByprofessorId(this.currentUser.id).subscribe(
      (courses: Course[]) => {
        this.courses = courses;
        const courseIds: string[] = courses
          .map(course => course.courseId ? course.courseId.toString() : undefined) // Convert number to string
          .filter((courseId): courseId is string => typeof courseId === 'string'); // Filter out undefined
          this.announcements.forEach(announcement => {
            this.selectedCoursesMap[announcement.id] = this.selectedCoursesMap[announcement.id] || []; // Initialize if undefined
          });
      },
      (error) => {
        console.error('Error loading courses:', error);
      }
    );
  }
  
  isSelected(course: any): boolean {
    const announcementId = 'current_announcement_id'; // Replace with actual announcement ID
    if (!this.selectedCoursesMap[announcementId]) {
      return false; // Return false if selectedCoursesMap is not defined for the announcement
    }
    return this.selectedCoursesMap[announcementId].some(selectedCourse => selectedCourse.courseId === course.courseId);
  }
  
  toggleSelection(event: any, course: any): void {
    const announcementId = 'current_announcement_id'; // Replace with actual announcement ID
    this.selectedCoursesMap[announcementId] = this.selectedCoursesMap[announcementId] || []; // Initialize if undefined
  
    if (event.target.checked) {
      // Course selected, add it to the list
      this.selectedCoursesMap[announcementId].push({ courseId: course.courseId, courseName: course.courseName });
    } else {
      // Course deselected, remove it from the list
      this.selectedCoursesMap[announcementId] = this.selectedCoursesMap[announcementId].filter(selectedCourse => selectedCourse.courseId !== course.courseId);
    }
  }
  
  // getAllCourses() {
  //   this.courseService.getAllCourses().subscribe((course) => {
  //     this.courses = course;
  //   })
  // }
  formatTimeForJavaSqlTime(timeString: string): string {
    const [hours, minutes] = timeString.split(':');

    const formattedHours = this.padNumber(parseInt(hours, 10), 2);
    const formattedMinutes = this.padNumber(parseInt(minutes, 10), 2);

    return `${formattedHours}:${formattedMinutes}:00`;
  }
  padNumber(num: number, size: number): string {
    let s = num + '';
    while (s.length < size) {
      s = '0' + s;
    }
    return s;
  }
  createNewCourse() {
    this.course.availableSlots = this.course.capacity;
    this.courseService.createNewCourse(this.course).subscribe({
      next: (course) => {
        this.classSchedules.forEach(s => {
          s.startTime = this.formatTimeForJavaSqlTime(s.startTime);
          s.endTime = this.formatTimeForJavaSqlTime(s.endTime);
          s.courseId = course.courseId;
        });
        this.courseService.addCourseScheudle(this.classSchedules).subscribe({
          next: (cs) => {
            this.loadAllCourses();
            this.isSubmit = true;
            this.success = true;
            this.message = 'Course ' + course.courseCode + ' created successfully';
            setTimeout(() => {
              this.clearFieldsAndMessage();
            }, 5000); // 5000 milliseconds = 5 seconds
          },
          error: (error) => {
            this.isSubmit = true;
            this.success = false;
            this.message = 'Failed to create course';
            console.error('There was an error:', error);
          }
        });
      }
    });
  }

  clearFieldsAndMessage() {
    this.course = {
      courseName: '',
      courseDescription: '',
      noOfAssignments: 0,
      noOfExams: 0,
      startDate: new Date(),
      endDate: new Date(),
      createdBy: this.currentUser.userName,
      createdByID: this.currentUser.id,
      capacity: 0,
      schedules: [],
      semester: '',
      courseCode: '',
      availableSlots: 0
    }; // Assuming Course is a class representing your course model
    this.classSchedules = []; // Clear class schedules array
    this.isSubmit = false; // Reset submit flag
    this.success = false; // Reset success flag
    this.message = '';
  }


  addAnnouncement() {
    this.announcements.push(this.newAnnouncement);
    this.newAnnouncement = { title: '', content: '' }; // Reset for next entry
  }
  addSchedule() {
    this.classSchedules.push({ ...this.schedules });
    // Reset schedules for next entry
    this.schedules = {
      dayOfWeek: '',
      startTime: '',
      endTime: ''
    };
  }

  removeSchedule(index: number): void {
    this.classSchedules.splice(index, 1);
  }

  onAssignmentChange() {

  }

  setActive(buttonName: string, event: any): void {
    this.success = false;
    this.noofMilestones = 0;
    this.milestone = false;
    this.activeButton = buttonName;
    this.moveSlider(event.target);
  }

  moveSlider(button: HTMLElement) {
    const sliderWidth = button.offsetWidth;
    const sliderOffset = button.offsetLeft;
    this.sliderStyle = {
      width: `${sliderWidth}px`,
      transform: `translateX(${sliderOffset}px)`
    };
  }

  ngAfterViewInit() {
    // Set the slider to the initial button on load
    const initialButton = this.buttonContainer.nativeElement.children[1]; // Assuming the first button is "Courses"
    this.moveSlider(initialButton);
  }

  onSubmit() {
    console.log(this.course);
  }
  addSyllabusModule() {
    this.exam.syllabus.push('');
    this.milestone =true;
    this.noofMilestones = this.exam.syllabus.length;
  }
  createNewExam() {
    this.exam.createdBy = this.currentUser.userName;
    this.exam.createdById = this.currentUser.id;
    this.examService.createExam(this.exam).subscribe({
      next: (exam) => {
        this.isSubmit = true;
        this.success = true;
        this.message = exam.examName + ' created successfully';
        setTimeout(() => {
          this.exam ={
            examNumber: 0,
            examName: '',
            courseId: '',
            courseCode: '',
            courseName: '',
            examDate: new Date(),
            examTime: '',
            roomNumber: '',
            syllabus: [],
            createdDate: new Date(),
            createdById: '',
            createdBy: '',
          }
        }, 3000);
      },
      error: (error) => {
        this.isSubmit = true;
        this.success = false;
        this.message = 'Failed to create course';
        console.error('There was an error:', error);
      }
    });
  }
  onExamCourseChange() {
    const course = this.courses.find((c: Course) => c.courseName === this.exam.courseName);
    if (course !== undefined && course !== null) {
      this.exam.courseCode = course.courseCode;
      this.exam.courseId = course.courseId
    }

  }
  onCourseChange(){
    const course = this.courses.find((c: Course) => c.courseName === this.assignment.courseName);
    if (course !== undefined && course !== null) {
      this.assignment.courseName = course.courseName;
      this.assignment.courseId = course.courseId
    }

  }

  createNewAnnouncement(){
    const visibilityArray: CourseVisibility[] = Object.values(this.selectedCoursesMap).flat();
this.announcement.visibility = visibilityArray;
    const selectedPriority = this.priorityOptions.find(priority => priority.name === this.announcement.priorityName);
    if (selectedPriority) {
      this.announcement.priorityId = selectedPriority.id;
    }
    this.announcementService.createAnnouncement(this.announcement).subscribe({
    next: (announcement) => {
        this.isSubmit = true;
        this.success = true;
        this.message = announcement.title + ' created successfully';
        setTimeout(() => {
          this.clearFieldsAndMessage();
        }, 5000);
      },
      error: (error) => {
        this.isSubmit = true;
        this.success = false;
        this.message = 'Failed to create course';
        console.error('There was an error:', error);
      }
    });
  }

  addNewAssignment(){
    this.assignment.createdBy = this.currentUser.userName;
    this.assignment.createdById = this.currentUser.id;
    this.assignmentService.createAssignment(this.assignment).subscribe({
    next: (assignment) => {
      this.isSubmit = true;
      this.success = true;
      this.message = assignment.assignmentName + ' created successfully';
      setTimeout(() => {
        this.assignment = {
          assignmentName: '',
          assignmentNumber: '',
          courseId: '',
          courseName: '',
          dueDate: new Date(),
          file: new File([], ''),
          createdDate: new Date(), 
          createdById: '', 
          createdBy: '' 
        };
      }, 5000);
    },
    error: (error) => {
      this.isSubmit = true;
      this.success = false;
      this.message = 'Failed to create course';
      console.error('There was an error:', error);
    }
  });
  }
  onFileChange(event: any) {
    const file = event.target.files[0];
    this.assignment.file = file;
    this.assignmentService.getAssignmentQuestions(this.assignment.file).subscribe((questions) => {
      console.log(questions);
      this.noofMilestones = questions.length;
      this.milestone = true;
    })
  }
  trackByIndex(index: number, obj: any): any {
    return index;
  }
  
}