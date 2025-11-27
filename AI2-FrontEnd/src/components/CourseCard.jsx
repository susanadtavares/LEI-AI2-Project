/*export default function CourseCard({ course }) {
  return (
    <div className="course-card">
      <h4>{course.title}</h4>
      <p><strong>Formador:</strong> {course.instructor || 'Sem Formador'}</p>
      <p><strong>Duração:</strong> {course.duration} Horas</p>
      <p><strong>Avaliação:</strong> {course.score}</p>
    </div>
  );
}*/

/*
import './CourseCard.css';
import { FaClock, FaUserAlt } from 'react-icons/fa';

export default function CourseCard({ course }) {
  return (
    <div className="course-card">
      {/*<div className="course-image" style={{ backgroundImage: `url(${course.image})` }}></div>}

      <div className="course-content">
        <h4>{course.title}</h4>
        <div className="stars">★ {course.score}</div>
        <p>{course.instructor}</p>

        <div className="course-meta">
          <span><FaClock /> {course.duration}</span>
          <span><FaUserAlt /> {course.rating}</span>
        </div>
      </div>
    </div>
  );
}
*/

import React from "react";

export default function CursoCard({ curso, nomeFormador }) {
  if (!curso) return null;

  return (
    <div className="bg-white shadow-md rounded-xl overflow-hidden w-full">
      <img src={`/cursos/${curso.imagem}`} alt={curso.titulo} className="w-full h-32 object-cover" />
      <div className="p-4">
        <h3 className="font-semibold">{curso.titulo}</h3>
        <p className="text-sm text-gray-600">{nomeFormador}</p>
        <div className="flex items-center gap-2 mt-2">
          <div className="text-yellow-500">
            {"★".repeat(curso.estrelas)}{"☆".repeat(5 - curso.estrelas)}
          </div>
        </div>
        <div className="flex justify-between text-sm mt-4 text-gray-500">
          <div>🕒 {curso.duracao} Horas</div>
          <div>👥 {curso.avaliacaoMedia}/10</div>
        </div>
      </div>
    </div>
  );
}
